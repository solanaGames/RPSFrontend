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
import { TOKEN_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/utils/token';
import { ASSOCIATED_TOKEN_PROGRAM_ID, getMinimumBalanceForRentExemptAccount, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, syncNative, createSyncNativeInstruction, createCloseAccountInstruction } from '@solana/spl-token';
import { useInterval } from '@chakra-ui/react';

window.Buffer = window.Buffer || require("buffer").Buffer;
  
  type GameState = any;

  type StoreContextType = {
    gameState: any,
    createGame: (choice: number) => Promise<string>,
    betSize: number,
    setBetSize: (arg: number) => void,
    solBalance: number,
    setSolBalance: (arg: number) => void,
  };
  
  const defaultContextValues: StoreContextType = {
    gameState: {},
    createGame: () => Promise.resolve(''),
    betSize: 0.01,
    setBetSize: () => {},
    solBalance: 0,
    setSolBalance: () => {},
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
    const [gameState, setGameState] = useLocalStorage<GameState>('gameState', {});
    const [solBalance, setSolBalance] = useState<number | null>(0);
    const [betSize, setBetSize] = useState<number>(0.01);
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

    const currentGameState = publicKey ? gameState[publicKey.toBase58()] : null;
    const setCurrentGameState = useCallback((newGameState: GameState) => {
      if (publicKey) {
        setGameState({
          ...gameState,
          [publicKey.toBase58()]: newGameState
        })
      }
    }, [currentGameState, setGameState, publicKey])

    const nominalBetSize = betSize * LAMPORTS_PER_SOL;


    async function loadSolBalance() {
      if (publicKey) {
          const balance = await connection.getBalance(publicKey)
          setSolBalance(balance / LAMPORTS_PER_SOL);
      } else {
        
      }
      loadSolBalance();
  }

  useEffect(() => {
    if (!publicKey) {
      setSolBalance(0)
    } else {
      loadSolBalance()
    }
  }, [publicKey]);

    // useEffect(() => {
    //     if (salt && gameKey) {
    //         console.log(salt, gameKey);
    //     if (intervalId) {
    //         console.log('kill', intervalId)
    //         clearInterval(intervalId);
    //     }
    //         const id = setInterval(async () => {
    //                 const gameInstance = await anchorProgram.account.game.fetch(new PublicKey(gameKey));
    //                 console.log('ping')
    //                 console.log(gameInstance);
    //                 setGameState(gameInstance);
    //         }, 10000);
    //         console.log('id:', id);
    //         setIntervalId(id);
    //     }
    // }, [salt, gameKey]);

    async function updateState() {
      console.log('updateState', gameState, currentGameState , publicKey.toBase58());
        if (currentGameState) {
          const currentGameKey = currentGameState.game
          const gameInstance = await anchorProgram.account.game.fetch(currentGameKey);

          console.log('gameInstance', gameInstance);
          if (gameInstance.state.acceptingReveal && currentGameState.status !== 'acceptingReveal') { 
                const tx = await anchorProgram.methods.revealGame(
                    { rock: {} }, new anchor.BN(Object.values(currentGameState.salt))
                ).accounts({
                  player: publicKey,
                  game: currentGameKey,
                }).transaction();


              const p2Ata = await getAssociatedTokenAddress(
                MINT,
                (gameInstance.state.acceptingReveal as any).player2.revealed.pubkey,
              )

                const settleIx = await anchorProgram.methods.settleGame().accounts({
                  game: currentGameKey,
                  player1TokenAccount: currentGameState.p1Ata,
                  // typescript thinks it's player_2 not player2
                  player2TokenAccount: p2Ata,
                  gameAuthority: currentGameState.gameAuthority,
                  escrowTokenAccount: currentGameState.escrowTokenAccount,
                  tokenProgram: TOKEN_PROGRAM_ID,
                }).instruction();

                setCurrentGameState({
                  ...currentGameState,
                  status: 'acceptingReveal'
                })

                const sig = await sendTransaction(tx.add(settleIx), connection)
                loadSolBalance();
                return sig;
            }
        }
    }


    useInterval(() => {
      updateState();
    }, 1000);

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
              seed,
              salt,
              game,
            })

            return {
              seed,
              salt,
              game,
            }
        }
    }, [publicKey])

    const createGame = useCallback(async (hand: number) => {
        if (!publicKey) throw ('Wallet not connected');

          let seed;
          let salt;
          let game;

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

          const tokenAccount = await getAssociatedTokenAddress(
              MINT,
              publicKey,
            )

          const [gameAuthority, _gameAuthorityBump] =
          PublicKey.findProgramAddressSync(
            [
              Buffer.from(anchor.utils.bytes.utf8.encode("authority")),
              game.toBuffer(),
            ],
            PROGRAM_ID
          );

          const [escrowTokenAccount, _escrowTokenAccountBump] =
            PublicKey.findProgramAddressSync(
              [
                Buffer.from(anchor.utils.bytes.utf8.encode("escrow")),
                game.toBuffer(),
              ],
              PROGRAM_ID
            );

            const commitment = Buffer.from(keccak_256(Buffer.concat([
                publicKey.toBuffer(),
                new anchor.BN(salt).toArrayLike(Buffer, "le", 8),
                new anchor.BN(hand).toArrayLike(Buffer, "le", 1),
              ])), "hex");

              const userWSOLAccountInfo = Boolean(await connection.getAccountInfo(
                tokenAccount,
            ));

            const newTxn = new Transaction()

            const rentExempt = await getMinimumBalanceForRentExemptAccount(
                connection,
            );

            const transferLamportsIx = SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: tokenAccount,
                lamports:
                  (userWSOLAccountInfo ? 0 : rentExempt) +
                  (nominalBetSize),
              });

            if (userWSOLAccountInfo) {
                const syncIx = await createSyncNativeInstruction(tokenAccount);
                newTxn.add(transferLamportsIx)
                newTxn.add(syncIx)
            } else {
                const createUserWSOLAccountIx = createAssociatedTokenAccountInstruction(
                    publicKey,
                    tokenAccount,
                    publicKey,
                    MINT,
                );
                
                newTxn.add(transferLamportsIx)
                newTxn.add(createUserWSOLAccountIx)
            }

            if (!userWSOLAccountInfo) {
                const closeWSOLAccountIx = createCloseAccountInstruction(
                    tokenAccount,
                    publicKey,
                    publicKey
                  );
                newTxn.add(closeWSOLAccountIx)
            }

              const ix = await anchorProgram.methods.createGame(
                new anchor.BN(seed),
                commitment.toJSON().data,
                new anchor.BN(nominalBetSize),
                null
              ).accounts({
                game,
                player: publicKey,
                mint: MINT,
                playerTokenAccount: tokenAccount,
                gameAuthority: gameAuthority,
                escrowTokenAccount: escrowTokenAccount,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              }).instruction();

              const signature = await sendTransaction(newTxn.add(ix), connection);

              setCurrentGameState({
                game,
                seed,
                salt,
                hand,
                p1Ata: tokenAccount,
                gameAuthority: gameAuthority.toBase58(),
                escrowTokenAccount: escrowTokenAccount.toBase58(),
              })

              return signature;
    }, [publicKey, JSON.stringify(currentGameState), nominalBetSize]);

    return (
      <StoreContext.Provider
        value={{gameState, createGame, betSize, setBetSize, solBalance, setSolBalance}}
      >
        {children}
      </StoreContext.Provider>
    );
  }
  
  export default (): StoreContextType => useContext(StoreContext);
  