import React, {
    createContext,
    ReactElement,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
  } from 'react';
  import * as anchor from '@coral-xyz/anchor';
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
  gameAuthority: PublicKey;
  salt: Uint8Array;
  seed: Uint8Array;
  secret?: Uint8Array;
  gameLink?: string;
}

type ParsedCreatedGame = {
  status: 'created';
  game: PublicKey;
  salt: Uint8Array;
  seed: Uint8Array;
  secret?: Uint8Array;
  gameLink?: string;
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
  player2: PublicKey,
}

type ParsedGameState = ParsedEmptyGame | ParsedInitializedGame | ParsedCreatedGame | ParsedChallengeExpired | ParsedSettled | ParsedRevealExpired;

type EmptyGame = {
  status: 'empty'
}

type InitializedGame = {
  status: 'initialized';
  game: string;
  gameAuthority: string,
  salt: string;
  seed: string;
  secret?: string;
  gameLink?: string;
}

type CreatedGame = {
  status: 'created';
  game: string;
  wager: number,
  salt: string;
  seed: string;
  secret?: string;
  gameLink?: string;
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
  player2: string,
}

type RevealExpired = Omit<CreatedGame, "status"> & {
  status: 'revealExpired'
}

type GameState = EmptyGame | InitializedGame | CreatedGame | ChallengeExpired | Settled | RevealExpired;

type AllGameState = {
  [key: string]: GameState
}

  type StoreContextType = {
    tempStatus: {
      status: string | null,
      secondaryData?: any,
    };
    parsedGameState: ParsedGameState,
    createGame: (choice: number) => Promise<string>,
    acceptChallenge: (choice: number) => Promise<string>,
    initializeGame: (pvp?: boolean) => ParsedInitializedGame
    expireGame: () => Promise<string>,
    betSize: number,
    setBetSize: (arg: number) => void,
    solBalance: number,
    setSolBalance: (arg: number) => void,
    challenged: boolean,
    setCurrentGameState: any,
    setTempStatus: (arg: {
      status: string | null,
      secondaryData?: any,
    }) => void,
  };
  
  const defaultContextValues: StoreContextType = {
    tempStatus: null,
    parsedGameState: {status: 'empty'},
    createGame: () => Promise.resolve(''),
    acceptChallenge: () => Promise.resolve(''),
    expireGame: () => Promise.resolve(''),
    initializeGame: (pvp?: boolean) => ({
      status: 'initialized',
      game: PublicKey.default,
      gameAuthority: PublicKey.default,
      seed: new Uint8Array(8),
      salt: new Uint8Array(8),
      secret: new Uint8Array(8),
    }),
    betSize: 0.01,
    setBetSize: () => {},
    challenged: false,
    solBalance: 0,
    setSolBalance: () => {},
    setCurrentGameState: () => {},
    setTempStatus: () => {},
  };
  
  export const StoreContext =
    createContext<StoreContextType>(defaultContextValues);
  
  type StoreProviderPropsType = {
    children: React.ReactNode;
  };
  
const PROGRAM_ID = new PublicKey("rpsVN2ZC1K9hoGPs83xahjWo46cDNP49Tk7rQb56ipE");
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
    const [tempStatus, setTempStatus] = useState<{
      status: string | null,
      secondaryData?: any,
    }>({status: null});
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

    const queryParams = Object.fromEntries((new URLSearchParams(window.location.search)).entries()) as {
      game: string | null,
      secret: string | null;
      gameAuthority: string | null;
    };

    const challenged = Boolean((queryParams.game && queryParams.secret && queryParams.gameAuthority));

    const currentGameState = publicKey ? (gameState[publicKey.toBase58()] ?? {status: 'empty' as 'empty'}) : {status: 'empty' as 'empty'};
    const setCurrentGameState = useCallback((newGameState: ParsedGameState) => {
      if (publicKey) {
        const ongoingState = (newGameState.status === 'created' || newGameState.status ===  'settled' || newGameState.status ===  'challengeExpired');
        const initialState = (newGameState.status === 'empty');
        setGameState({
          ...gameState,
          [publicKey.toBase58()]: {
            status: newGameState.status,
            game: newGameState.status !== 'empty' ? newGameState.game.toBase58() : undefined,
            salt: !initialState ? newGameState.salt.toString() : undefined,
            seed: !initialState ? newGameState.seed.toString() : undefined,
            secret: newGameState.status !== 'empty' ? newGameState.secret?.toString() : undefined,
            gameLink: !initialState ? newGameState.gameLink : undefined,
            hand: ongoingState ? newGameState.hand : undefined,
            player1: ongoingState ? newGameState.player1.toBase58() : undefined,
            player2: newGameState.status === 'settled' ? newGameState.player2.toBase58() : undefined,
            wager: ongoingState ? newGameState.wager : undefined,
            gameAuthority: ongoingState || newGameState.status ===  'initialized' ? newGameState.gameAuthority.toBase58() : undefined,
            opponentHand: newGameState.status === 'settled' ? newGameState.opponentHand : undefined,
            result: newGameState.status === 'settled' ? newGameState.result : undefined,
          }
        })
      }
    }, [currentGameState, setGameState, publicKey])

    const nominalBetSize = Math.floor(betSize * LAMPORTS_PER_SOL);

    const ongoingState = (currentGameState.status === 'created' || currentGameState.status ===  'settled' || currentGameState.status ===  'challengeExpired')
    const initialState = (currentGameState.status === 'empty');

    const parsedGameState: ParsedGameState = {
      status: currentGameState.status,
      game: currentGameState.status !== 'empty' ? new PublicKey(currentGameState.game) : undefined,
      salt: !initialState ? new Uint8Array(currentGameState.salt.split(',').map(Number)) : undefined,
      seed: !initialState ? new Uint8Array(currentGameState.seed.split(',').map(Number)) : undefined,
      secret: (currentGameState.status !== 'empty' && currentGameState.secret) ? new Uint8Array(currentGameState.secret.split(',').map(Number)) : undefined,
      gameLink: !initialState ? currentGameState.gameLink : undefined,
      hand: ongoingState ? currentGameState.hand : undefined,
      wager: ongoingState ? currentGameState.wager : undefined,
      player1: ongoingState ? new PublicKey(currentGameState.player1) : undefined,
      player2: currentGameState.status === 'settled' ? new PublicKey(currentGameState.player2) : undefined,
      gameAuthority: ongoingState || currentGameState.status ===  'initialized' ? new PublicKey(currentGameState.gameAuthority) : undefined,
      opponentHand: currentGameState.status === 'settled' ? currentGameState.opponentHand : undefined,
      result: currentGameState.status === 'settled' ? currentGameState.result : undefined,
    };

    async function loadSolBalance() {
      if (publicKey) {
          const balance = await connection.getBalance(publicKey)
          console.log(balance);
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

  const [playerInfo, _playerInfoBump] =  useMemo(() => {
    return publicKey ? PublicKey.findProgramAddressSync(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode("player_info")),
          publicKey.toBuffer(),
        ],
        PROGRAM_ID
    ) : [PublicKey.default, 0];
  }, [publicKey, PROGRAM_ID])

  async function expireGame() {
    let signature = 'Transaction not completed';
    try {
      if (parsedGameState.status === 'challengeExpired') {
        const tx = await anchorProgram.methods.expireGame().accounts({
          game: parsedGameState.game,
          player: publicKey,
          playerInfo,
        }).transaction();

        const settleIx = await anchorProgram.methods.settleGame().accounts({
          game: parsedGameState.game,
          player1: parsedGameState.player1,
          player1Info: playerInfo,
          player2: parsedGameState.player1,
          player2Info: playerInfo,
          gameAuthority: parsedGameState.gameAuthority,
          systemProgram: anchor.web3.SystemProgram.programId,
        }).instruction();

        tx.add(settleIx)

        setTempStatus({
          status: 'signExpired',
        });
        signature = await sendTransaction(tx, connection);
        const latestBlockHash = await connection.getLatestBlockhash();
        await connection.confirmTransaction({
          ...latestBlockHash,
          signature,
        });

        setCurrentGameState({ status: 'empty'});
        await loadSolBalance();
        setTempStatus({status: null});
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
        setTempStatus({status:'error'});
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

    return signature;
  }

    async function updateState() {
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
              result: ['won', 'lost', 'tied'][[gameInstance.state.settled.result.p1,gameInstance.state.settled.result.p2, gameInstance.state.settled.result.tie].findIndex(Boolean)] as 'won' | 'lost' | 'tied',
              opponentHand: [gameInstance.state.settled.player2.revealed.choice.rock,gameInstance.state.settled.player2.revealed.choice.paper,gameInstance.state.settled.player2.revealed.choice.scissors].findIndex(Boolean),
              player2: gameInstance.state.settled.player2.revealed.pubkey,
              status: 'settled'
            })
            return;
          }

          if (gameInstance.state.acceptingChallenge) {
            const expiry = gameInstance.state.acceptingChallenge.expirySlot;
            const currentSlot = await connection.getSlot();

            if (currentSlot > expiry.toNumber()) {
              setCurrentGameState({
                ...parsedGameState,
                status: 'challengeExpired',
              })
              return;
            }
          }

          // if (gameInstance.state.acceptingReveal) {
          //   const expiry = gameInstance.state.acceptingReveal.expirySlot;
          //   const currentSlot = await connection.getSlot();

          //   if (currentSlot > expiry.toNumber()) {
          //     setCurrentGameState({
          //       ...parsedGameState,
          //       status: 'revealExpired',
          //     })
          //     return;
          //   }
          // }

          if (gameInstance.state.acceptingReveal && parsedGameState.status === 'created' && !settling) {
                setSettling(true);
                const option = [{rock: {}}, {paper: {}}, {scissors: {}}][parsedGameState.hand]
                const tx = await anchorProgram.methods.revealGame(
                  option, new anchor.BN(parsedGameState.salt)
                ).accounts({
                  game: currentGameKey,
                  player: publicKey,
                  playerInfo,
                }).transaction();

                const p2Key: PublicKey = (gameInstance.state.acceptingReveal as any).player2.revealed.pubkey;
                const [ player2Info, _player2InfoBump] = PublicKey.findProgramAddressSync(
                  [
                    Buffer.from(anchor.utils.bytes.utf8.encode("player_info")),
                    p2Key.toBuffer(),
                  ],
                  PROGRAM_ID
              );
              const p1 = await anchorProgram.account.playerInfo.fetch(playerInfo)
              const p2 = await anchorProgram.account.playerInfo.fetch(player2Info)

              console.log(p1, p2, playerInfo.toBase58(), player2Info.toBase58());
                const settleIx = await anchorProgram.methods.settleGame().accounts({
                  game: currentGameKey,
                  player1: (gameInstance.state.acceptingReveal as any).player1.committed.pubkey,
                  player1Info: playerInfo,
                  player2: p2Key,
                  player2Info: player2Info,
                  gameAuthority: parsedGameState.gameAuthority,
                  systemProgram: anchor.web3.SystemProgram.programId,
                }).instruction();

                tx.add(settleIx)

              setTempStatus({status: 'signSettle'});
              signature = await sendTransaction(tx, connection, {skipPreflight: true})
              const latestBlockHash = await connection.getLatestBlockhash();
              await connection.confirmTransaction({
                ...latestBlockHash,
                signature,
              });

              await loadSolBalance();
              setTempStatus({status: null});
              setSettling(false);
            }
        }
      }
        setPing(ping + 1);
      } catch (e: any) {
          setTempStatus({status: 'error'});
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

    async function acceptChallenge(hand: number) {
      let signature = 'Transaction not completed';
      try {
        if (challenged) {
          const gameKey = new PublicKey(queryParams.game);
          const gameAuthority = new PublicKey(queryParams.gameAuthority);
          const gameSecret = new anchor.BN(queryParams.secret);
          const option = [{rock: {}}, {paper: {}}, {scissors: {}}][hand]

          const newTxn = new Transaction();

          const [playerInfo, _playerInfoBump] = PublicKey.findProgramAddressSync(
            [
            Buffer.from(anchor.utils.bytes.utf8.encode("player_info")),
            publicKey.toBuffer(),
            ],
            PROGRAM_ID
        );

          if (!(await connection.getAccountInfo(playerInfo))) {
            newTxn.add(await anchorProgram.methods.createPlayerInfo().accounts({
              owner: publicKey,
              playerInfo: playerInfo,
              systemProgram: anchor.web3.SystemProgram.programId,
            }).instruction());
          }

          newTxn.add(await anchorProgram.methods.joinGame(
            option,
            gameSecret
          ).accounts({
            player: publicKey,
            playerInfo,
            game: gameKey,
            gameAuthority,
            systemProgram: anchor.web3.SystemProgram.programId,
          }).instruction());

          setTempStatus({
            status: 'signExpired',
          });
          signature = await sendTransaction(newTxn, connection);
          const latestBlockHash = await connection.getLatestBlockhash();
          await connection.confirmTransaction({
            ...latestBlockHash,
            signature,
          });

          setCurrentGameState({ status: 'empty'});
          await loadSolBalance();
          setTempStatus({status: null});
          toast({
            position: 'bottom-left',
            render: () => (
            <Box color='white' p={3} bg='blue.500'>
                Challenge accepted: {signature}
            </Box>
            )
        })
        }
      } catch (e: any) {
          setTempStatus({status:'error'});
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

      return signature;
    }

    async function updateChallenge() {    
      console.log(tempStatus)
      // double check pvp hasn't been cancelled since the last timeout was set
        const queryParams = Object.fromEntries((new URLSearchParams(window.location.search)).entries()) as {
          game: string | null,
          secret: string | null;
          gameAuthority: string | null;
        };

        console.log('ping', !queryParams.game, !queryParams.secret, queryParams.gameAuthority);
        if (!queryParams.game || !queryParams.secret || !queryParams.gameAuthority) return;

        console.log('ping2', queryParams);
        let gameInstance;
        try {
          gameInstance = await anchorProgram.account.game.fetch(new PublicKey(queryParams.game));
        } catch(error) {
          setTempStatus({
            status: 'waiting',
          })
          console.log(error);
          setPing(ping + 1);
          return;
        }

        if (gameInstance.state.acceptingChallenge) {
          const expiry = gameInstance.state.acceptingChallenge.expirySlot;
          const currentSlot = await connection.getSlot();

          if (currentSlot > expiry.toNumber()) {
            setTempStatus({status: 'challengedExpired'});
            // present link to clear localStorage and queryParams
            return;
          }

          setTempStatus({status: 'challengedTurn',
            secondaryData: {
              opponent: gameInstance.state.acceptingChallenge.player1.committed.pubkey.toBase58(),
              amount: gameInstance.wagerAmount.toNumber() / LAMPORTS_PER_SOL
            },
          });
        }


        if (gameInstance.state.acceptingReveal) {
          setTempStatus({
            status: 'awaitingReveal',
            secondaryData: {
              choice: [
                gameInstance.state.acceptingReveal.player2.revealed.choice.rock,
                gameInstance.state.acceptingReveal.player2.revealed.choice.paper,
                gameInstance.state.acceptingReveal.player2.revealed.choice.scissors
              ].findIndex(Boolean)
            },
          });
        }

        if (gameInstance.state.settled) {
          setTempStatus({
            status: 'challengedSettled',
            secondaryData: {
              opponent: gameInstance.state.settled.player1.revealed.pubkey.toBase58(),
              result: ['won', 'lost', 'tied'][[gameInstance.state.settled.result.p2,gameInstance.state.settled.result.p1, gameInstance.state.settled.result.tie].findIndex(Boolean)] as 'won' | 'lost' | 'tied',
              choice: [
                gameInstance.state.settled.player1.revealed.choice.rock,
                gameInstance.state.settled.player1.revealed.choice.paper,
                gameInstance.state.settled.player1.revealed.choice.scissors
              ].findIndex(Boolean)
            }
          });
          // change to object and present results here
        }
      setPing(ping + 1);
    }

    useEffect(
      () => {
        if (challenged) {
          setTimeout(() => updateChallenge(), 1000);
        } else {
          setTimeout(() => updateState(), 1000);
        }
      }, [ping, parsedGameState.status]
    );

    const initializeGame = useCallback((pvp?: boolean) => {
        if (publicKey) {
            const seed = new Uint8Array(8);
            window.crypto.getRandomValues(seed);

            const salt = new Uint8Array(8);
            window.crypto.getRandomValues(salt);

            const secret = new Uint8Array(8);
            window.crypto.getRandomValues(secret);

            const [game, _gameBump] = PublicKey.findProgramAddressSync(
              [
              Buffer.from(anchor.utils.bytes.utf8.encode("game")),
                  new anchor.BN(seed).toArrayLike(Buffer, "le", 8),
              ],
              PROGRAM_ID
          );

          const [gameAuthority, _gameAuthorityBump] =
          PublicKey.findProgramAddressSync(
            [
              Buffer.from(anchor.utils.bytes.utf8.encode("authority")),
              game.toBuffer(),
            ],
            PROGRAM_ID
          );

          const searchParams = new URLSearchParams({
            game: game.toBase58(),
            secret: new anchor.BN(secret).toString(),
            gameAuthority: gameAuthority.toBase58(),
          });

          const gameLink = `${window.location.origin}/?${searchParams.toString()}`;

            setCurrentGameState({
              status: 'initialized',
              seed,
              salt,
              game,
              secret,
              gameAuthority,
              gameLink: pvp ? gameLink : undefined,
            })

            return {
              status: 'initialized' as 'initialized',
              seed,
              salt,
              game,
              secret,
              gameAuthority,
              gameLink: pvp ? gameLink : undefined,
            }
        }
    }, [publicKey])

    const createGame = useCallback(async (hand: number) => {
      let signature = 'Transaction not completed';
      try {
        if (!publicKey) throw ('Wallet not connected');

          let seed: Uint8Array;
          let salt: Uint8Array;
          let secret: Uint8Array;
          let game: PublicKey;
          let gameAuthority: PublicKey;
          let gameLink: string;

          if ((parsedGameState.status === 'initialized' || parsedGameState.status === 'settled')  && parsedGameState.gameLink) {
            salt = parsedGameState.salt;
            seed = parsedGameState.seed;
            game = parsedGameState.game;
            secret = parsedGameState.secret;
            gameAuthority = parsedGameState.gameAuthority;
            gameLink = parsedGameState.gameLink;
          } else {
            const res = initializeGame();
            seed = res.seed;
            salt = res.salt;
            game = res.game;
            gameAuthority = res.gameAuthority;
            gameLink = res.gameLink;
          }

            const commitment = Buffer.from(keccak_256(Buffer.concat([
                publicKey.toBuffer(),
                new anchor.BN(salt).toArrayLike(Buffer, "le", 8),
                new anchor.BN(hand).toArrayLike(Buffer, "le", 1),
              ])), "hex");

            const newTxn = new Transaction();

            const [playerInfo, _playerInfoBump] = PublicKey.findProgramAddressSync(
                [
                Buffer.from(anchor.utils.bytes.utf8.encode("player_info")),
                publicKey.toBuffer(),
                ],
                PROGRAM_ID
            );

              if (!(await connection.getAccountInfo(playerInfo))) {
                newTxn.add(await anchorProgram.methods.createPlayerInfo().accounts({
                  owner: publicKey,
                  playerInfo: playerInfo,
                  systemProgram: anchor.web3.SystemProgram.programId,
                }).instruction());
              }

              const ix = await anchorProgram.methods.createGame(
                new anchor.BN(seed),
                commitment.toJSON().data,
                new anchor.BN(nominalBetSize),
                secret ? Buffer.from(keccak_256(Buffer.concat([
                  game.toBuffer(),
                  new anchor.BN(secret).toArrayLike(Buffer, "le", 8),
                ])), "hex") : null
              ).accounts({
                game,
                player: publicKey,
                playerInfo: playerInfo,
                gameAuthority,
                systemProgram: anchor.web3.SystemProgram.programId,
              }).instruction();

              newTxn.add(ix)

              setTempStatus({status: 'signCreate'});
              signature = await sendTransaction(newTxn, connection, {skipPreflight: true});
              const latestBlockHash = await connection.getLatestBlockhash();
              await connection.confirmTransaction({
                ...latestBlockHash,
                signature,
              });
              await loadSolBalance();
              setTempStatus({status: null});

              setCurrentGameState({
                status: "created",
                game: game,
                seed: seed,
                secret: secret,
                salt: salt,
                wager: betSize,
                hand,
                player1: publicKey,
                gameAuthority: gameAuthority,
                gameLink,
              });

            } catch (e: any) {
                setTempStatus({status: 'error'});
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
        value={{ challenged, acceptChallenge, setTempStatus, expireGame, setCurrentGameState, tempStatus, createGame, betSize, setBetSize, solBalance, setSolBalance, parsedGameState, initializeGame}}
      >
        {children}
      </StoreContext.Provider>
    );
  }
  
  export default (): StoreContextType => useContext(StoreContext);
  