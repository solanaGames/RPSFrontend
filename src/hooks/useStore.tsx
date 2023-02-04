import React, {
    createContext,
    ReactElement,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
  } from 'react';
  import * as anchor from '@coral-xyz/anchor';
import { StringParam, useQueryParam } from 'use-query-params';
import { useConnection, useLocalStorage, useWallet } from '@solana/wallet-adapter-react';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import {Rps, IDL} from '../rps';
import { keccak_256 } from "js-sha3";
import { Box, useToast } from '@chakra-ui/react';

window.Buffer = window.Buffer || require("buffer").Buffer;

type ParsedEmptyGame = {
  status: 'empty'
}
type ParsedInitializedGame = {
  status: 'initialized';
  game: PublicKey;
  salt: Uint8Array;
  seed: Uint8Array;
}

type ParsedCreatedGame = {
  status: 'created';
  game: PublicKey;
  salt: Uint8Array;
  seed: Uint8Array;
  hand: number,
  wager: number,
  player1: PublicKey,
  gameAuthority: PublicKey,
}

type ParsedChallengeExpired = Omit<ParsedCreatedGame, "status"> & {
  status: 'challengeExpired'
}
type ParsedRevealExpired = Omit<ParsedCreatedGame, "status"> & {
  status: 'revealExpired'
}

type ParsedSettled = Omit<ParsedCreatedGame, "status"> & {
  status: 'settled',
  result: 'won' | 'lost' | 'tied',
  opponentHand: number,
}

type ParsedGameState = ParsedEmptyGame | ParsedInitializedGame | ParsedCreatedGame | ParsedChallengeExpired | ParsedSettled | ParsedRevealExpired;

type EmptyGame = {
  status: 'empty'
}

type InitializedGame = {
  status: 'initialized';
  game: string;
  salt: string;
  seed: string;
}

type CreatedGame = {
  status: 'created';
  game: string;
  wager: number,
  salt: string;
  seed: string;
  hand: number,
  player1: string,
  gameAuthority: string,
}

type ChallengeExpired = Omit<CreatedGame, "status"> & {
  status: 'challengeExpired'
}

type Settled = Omit<CreatedGame, "status"> & {
  status: 'settled',
  result: 'won' | 'lost' | 'tied',
  opponentHand: number,
}

type RevealExpired = Omit<CreatedGame, "status"> & {
  status: 'revealExpired'
}

type GameState = EmptyGame | InitializedGame | CreatedGame | ChallengeExpired | Settled | RevealExpired;

type AllGameState = {
  [key: string]: GameState
}

  type StoreContextType = {
    tempStatus: string | null;
    parsedGameState: ParsedGameState,
    createGame: (choice: number) => Promise<string>,
    expireGame: () => Promise<string>,
    betSize: number,
    setBetSize: (arg: number) => void,
    solBalance: number,
    setSolBalance: (arg: number) => void,
    setCurrentGameState: any,
  };
  
  const defaultContextValues: StoreContextType = {
    tempStatus: null,
    parsedGameState: {status: 'empty'},
    createGame: () => Promise.resolve(''),
    expireGame: () => Promise.resolve(''),
    betSize: 0.01,
    setBetSize: () => {},
    solBalance: 0,
    setSolBalance: () => {},
    setCurrentGameState: () => {},
  };
  
  export const StoreContext =
    createContext<StoreContextType>(defaultContextValues);
  
  type StoreProviderPropsType = {
    children: React.ReactNode;
  };
  
const PROGRAM_ID = new PublicKey('rpsx2U29nY4LQmzw9kdvc7sgDBYK8N2UXpex3SJofuX');
const MINT = new PublicKey('So11111111111111111111111111111111111111112');

  export function StoreProvider({
    children,
  }: StoreProviderPropsType): ReactElement {
    const [ping, setPing] = useState(0);
    const toast = useToast({
      containerStyle: {
        width: '300px',
        maxWidth: '100%',
      },
    });
    const [tempStatus, setTempStatus] = useState<string | null>(null);
    const [gameState, setGameState] = useLocalStorage<AllGameState>('gameState', {});
    const [solBalance, setSolBalance] = useState<number | null>(0);
    const [betSize, setBetSize] = useState<number>(0.01);
    const [settling, setSettling] = useState<boolean>(false);
    const { connection } = useConnection();
    const { wallet, publicKey, sendTransaction } = useWallet();
    const anchorProgram = useRef(new anchor.Program(
          IDL,
          PROGRAM_ID,
          new anchor.AnchorProvider(
              connection,
              (wallet?.adapter as any) ??
                new NodeWallet(Keypair.fromSeed(new Uint8Array(32).fill(1))),
              {},
            ),
        )).current

    const currentGameState = publicKey ? (gameState[publicKey.toBase58()] ?? {status: 'empty' as 'empty'}) : {status: 'empty' as 'empty'};
    const setCurrentGameState = useCallback((newGameState: ParsedGameState) => {
      if (publicKey) {
        const ongoingState = (newGameState.status === 'created' || newGameState.status ===  'settled' || newGameState.status ===  'challengeExpired')
        setGameState({
          ...gameState,
          [publicKey.toBase58()]: {
            status: newGameState.status,
            game: newGameState.status !== 'empty' ? newGameState.game.toBase58() : undefined,
            salt: newGameState.status !== 'empty' ? newGameState.salt.toString() : undefined,
            seed: newGameState.status !== 'empty' ? newGameState.seed.toString() : undefined,
            hand: ongoingState ? newGameState.hand : undefined,
            player1: ongoingState ? newGameState.player1.toBase58() : undefined,
            wager: ongoingState ? newGameState.wager : undefined,
            gameAuthority: ongoingState ? newGameState.gameAuthority.toBase58() : undefined,
            opponentHand: newGameState.status === 'settled' ? newGameState.opponentHand : undefined,
            result: newGameState.status === 'settled' ? newGameState.result : undefined,
          }
        })
      }
    }, [currentGameState, setGameState, publicKey])

    const nominalBetSize = Math.floor(betSize * LAMPORTS_PER_SOL);

    const ongoingState = (currentGameState.status === 'created' || currentGameState.status ===  'settled' || currentGameState.status ===  'challengeExpired')

    const parsedGameState: ParsedGameState = {
      status: currentGameState.status,
      game: currentGameState.status !== 'empty' ? new PublicKey(currentGameState.game) : undefined,
      salt: currentGameState.status !== 'empty' ? new Uint8Array(currentGameState.salt.split(',').map(Number)) : undefined,
      seed: currentGameState.status !== 'empty' ? new Uint8Array(currentGameState.seed.split(',').map(Number)) : undefined,
      hand: ongoingState ? currentGameState.hand : undefined,
      wager: ongoingState ? currentGameState.wager : undefined,
      player1: ongoingState ? new PublicKey(currentGameState.player1) : undefined,
      gameAuthority: ongoingState ? new PublicKey(currentGameState.gameAuthority) : undefined,
      opponentHand: currentGameState.status === 'settled' ? currentGameState.opponentHand : undefined,
      result: currentGameState.status === 'settled' ? currentGameState.result : undefined,
    };

    async function loadSolBalance() {
      if (publicKey) {
          const balance = await connection.getBalance(publicKey)
          setSolBalance(balance / LAMPORTS_PER_SOL);
      }
  }

  useEffect(() => {
    if (!publicKey) {
      setSolBalance(0)
    } else {
      loadSolBalance()
    }
  }, [publicKey]);

  async function expireGame() {
    let signature = 'Transaction not completed';
    try {
      if (parsedGameState.status === 'challengeExpired') {
        const tx = await anchorProgram.methods.expireGame().accounts({
          game: parsedGameState.game,
          player: publicKey,
        }).transaction();
        
        const settleIx = await anchorProgram.methods.settleGame().accounts({
          game: parsedGameState.game,
          player1: parsedGameState.player1,
          player2: parsedGameState.player1,
          gameAuthority: parsedGameState.gameAuthority,
          systemProgram: anchor.web3.SystemProgram.programId,
        }).instruction();

        tx.add(settleIx)

        setTempStatus('signExpired');
        signature = await sendTransaction(tx, connection);
        const latestBlockHash = await connection.getLatestBlockhash();
        await connection.confirmTransaction({
          ...latestBlockHash,
          signature,
        });

        setCurrentGameState({ status: 'empty'});
        await loadSolBalance();
        setTempStatus(null);
        toast({
          position: 'bottom-left',
          render: () => (
          <Box color='white' p={3} bg='blue.500'>
              Funds refunded: {signature}
          </Box>
          )
      })
      }
    } catch (e: any) {
        setTempStatus('error');
        toast({
          position: 'bottom-left',
          render: () => (
              <Box color='white' p={3} bg='blue.500'>
              Error: {e.message}
              </Box>
          )
      })
      console.error(e);
    }

    return signature
    
  }

    async function updateState() {
      console.log('ping');
      let signature = 'Transaction not completed';
      try {
        if (parsedGameState) {
          if (!(parsedGameState.status === 'initialized' || parsedGameState.status === 'empty')) {

          const currentGameKey = parsedGameState.game
          let gameInstance;
          try {
            gameInstance = await anchorProgram.account.game.fetch(currentGameKey);
          } catch(error) {
            console.error(error);
            setPing(ping + 1);
            return;
          }

          if (gameInstance.state.settled) {
            setCurrentGameState({
              ...parsedGameState,
              result: ['won', 'lost', 'tied'][[gameInstance.state.settled.result.p1,gameInstance.state.settled.result.p2, (gameInstance.state.settled.result as any).tie].findIndex(Boolean)] as 'won' | 'lost' | 'tied',
              opponentHand: [(gameInstance.state.settled as any).player2.revealed.choice.rock,(gameInstance.state.settled as any).player2.revealed.choice.paper,(gameInstance.state.settled as any).player2.revealed.choice.scissors].findIndex(Boolean),
              status: 'settled'
            })
            return;
          }

          if (gameInstance.state.acceptingChallenge) {
            const expiry = (gameInstance.state.acceptingChallenge as any).expirySlot;
            const currentSlot = await connection.getSlot();

            if (currentSlot > expiry.toNumber()) {
              setCurrentGameState({
                ...parsedGameState,
                status: 'challengeExpired',
              })
              return;
            }
          }


          if (gameInstance.state.acceptingReveal) {
            const expiry = (gameInstance.state.acceptingReveal as any).expirySlot;
            const currentSlot = await connection.getSlot();

            if (currentSlot > expiry.toNumber()) {
              setCurrentGameState({
                ...parsedGameState,
                status: 'revealExpired',
              })
              return;
            }
          }

          if (gameInstance.state.acceptingReveal && parsedGameState.status === 'created' && !settling) {
                setSettling(true);
                const option = [{rock: {}}, {paper: {}}, {scissors: {}}][parsedGameState.hand]
                const tx = await anchorProgram.methods.revealGame(
                  option, new anchor.BN(parsedGameState.salt)
                ).accounts({
                  player: publicKey,
                  game: currentGameKey,
                }).transaction();

                const player1 = parsedGameState.player1;

                const settleIx = await anchorProgram.methods.settleGame().accounts({
                  game: currentGameKey,
                  player1: (gameInstance.state.acceptingReveal as any).player1.revealed.pubkey,
                  player2: (gameInstance.state.acceptingReveal as any).player2.revealed.pubkey,
                  gameAuthority: parsedGameState.gameAuthority,
                  systemProgram: anchor.web3.SystemProgram.programId,
                }).instruction();

                tx.add(settleIx)

              setTempStatus('signSettle');
              signature = await sendTransaction(tx, connection)
              const latestBlockHash = await connection.getLatestBlockhash();
              await connection.confirmTransaction({
                ...latestBlockHash,
                signature,
              });

              await loadSolBalance();
              setTempStatus(null);
              setSettling(false);
            }
        }
      }
        setPing(ping + 1);
      } catch (e: any) {
          setTempStatus('error');
          toast({
            position: 'bottom-left',
            render: () => (
                <Box color='white' p={3} bg='blue.500'>
                Error: {e.message}
                </Box>
            )
        });
        setPing(ping + 1);
        console.error(e);
      }
  
      return signature
    }

    useEffect(
      () => {
        // if (parsedGameState.status === 'created') {
          setTimeout(() => updateState(), 1000);
        // }
      }, [ping, parsedGameState.status]
    );

    const initializeGame = useCallback((pvp?: boolean) => {
        if (publicKey) {
            const seed = new Uint8Array(8);
            window.crypto.getRandomValues(seed);

            const salt = new Uint8Array(8);
            window.crypto.getRandomValues(salt);


            const [game, _gameBump] = PublicKey.findProgramAddressSync(
              [
              Buffer.from(anchor.utils.bytes.utf8.encode("game")),
                  new anchor.BN(seed).toArrayLike(Buffer, "le", 8),
              ],
              PROGRAM_ID
          );

            // const entryKey = new Uint8Array(8);
            // window.crypto.getRandomValues(entryKey);

            setCurrentGameState({
              status: 'initialized',
              seed: seed,
              salt: salt,
              game: game,
            })

            return {
              seed,
              salt,
              game,
            }
        }
    }, [publicKey])

    const createGame = useCallback(async (hand: number) => {
      let signature = 'Transaction not completed';
      try {
        if (!publicKey) throw ('Wallet not connected');

          let seed: Uint8Array;
          let salt: Uint8Array;
          let game: PublicKey;

          // if (currentGameState) {
          //   if (currentGameState.status !== 'initialized') {
          //     throw Error('Creating game when an existing one is not finished.');
          //   }
          //   salt = Object.values(currentGameState.salt);
          //   seed = Object.values(currentGameState.seed);
          //   game = new PublicKey(currentGameState.game);
          // } else {
            const res = initializeGame();
            seed = res.seed;
            salt = res.salt;
            game = res.game;
          // }

          const [gameAuthority, _gameAuthorityBump] =
          PublicKey.findProgramAddressSync(
            [
              Buffer.from(anchor.utils.bytes.utf8.encode("authority")),
              game.toBuffer(),
            ],
            PROGRAM_ID
          );

            const commitment = Buffer.from(keccak_256(Buffer.concat([
                publicKey.toBuffer(),
                new anchor.BN(salt).toArrayLike(Buffer, "le", 8),
                new anchor.BN(hand).toArrayLike(Buffer, "le", 1),
              ])), "hex");

            const newTxn = new Transaction()

              const ix = await anchorProgram.methods.createGame(
                new anchor.BN(seed),
                commitment.toJSON().data,
                new anchor.BN(nominalBetSize),
                null
              ).accounts({
                game,
                player: publicKey,
                gameAuthority: gameAuthority,
                systemProgram: anchor.web3.SystemProgram.programId,
              }).instruction();

              newTxn.add(ix)

              setTempStatus('signCreate');
              signature = await sendTransaction(newTxn, connection);
              const latestBlockHash = await connection.getLatestBlockhash();
              await connection.confirmTransaction({
                ...latestBlockHash,
                signature,
              });
              await loadSolBalance();
              setTempStatus(null);

              setCurrentGameState({
                status: "created",
                game: game,
                seed: seed,
                salt: salt,
                wager: betSize,
                hand,
                player1: publicKey,
                gameAuthority: gameAuthority,
              });

            } catch (e: any) {
                setTempStatus('error');
                toast({
                  position: 'bottom-left',
                  render: () => (
                      <Box color='white' p={3} bg='blue.500'>
                      Error: {e.message}
                      </Box>
                  )
              })
              console.error(e);
            }
        
            return signature
    }, [publicKey, JSON.stringify(currentGameState), nominalBetSize]);

    return (
      <StoreContext.Provider
        value={{expireGame, setCurrentGameState, tempStatus, createGame, betSize, setBetSize, solBalance, setSolBalance, parsedGameState}}
      >
        {children}
      </StoreContext.Provider>
    );
  }
  
  export default (): StoreContextType => useContext(StoreContext);
  