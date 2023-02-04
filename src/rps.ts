export type Rps = {
  version: "0.1.0";
  name: "rps";
  instructions: [
    {
      name: "createGame";
      accounts: [
        {
          name: "game";
          isMut: true;
          isSigner: false;
        },
        {
          name: "player";
          isMut: true;
          isSigner: true;
        },
        {
          name: "gameAuthority";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "gameSeed";
          type: "u64";
        },
        {
          name: "commitment";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "wagerAmount";
          type: "u64";
        },
        {
          name: "entryProof";
          type: {
            option: {
              array: ["u8", 32];
            };
          };
        }
      ];
    },
    {
      name: "joinGame";
      accounts: [
        {
          name: "player";
          isMut: true;
          isSigner: true;
        },
        {
          name: "game";
          isMut: true;
          isSigner: false;
        },
        {
          name: "gameAuthority";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "choice";
          type: {
            defined: "RPS";
          };
        },
        {
          name: "secret";
          type: {
            option: "u64";
          };
        }
      ];
    },
    {
      name: "revealGame";
      accounts: [
        {
          name: "game";
          isMut: true;
          isSigner: false;
        },
        {
          name: "player";
          isMut: false;
          isSigner: true;
        }
      ];
      args: [
        {
          name: "choice";
          type: {
            defined: "RPS";
          };
        },
        {
          name: "salt";
          type: "u64";
        }
      ];
    },
    {
      name: "expireGame";
      accounts: [
        {
          name: "game";
          isMut: true;
          isSigner: false;
        },
        {
          name: "player";
          isMut: false;
          isSigner: false;
          docs: [
            "checked in the game logic code so this doesn't need to be a signer"
          ];
        }
      ];
      args: [];
    },
    {
      name: "settleGame";
      accounts: [
        {
          name: "game";
          isMut: true;
          isSigner: false;
        },
        {
          name: "player1";
          isMut: true;
          isSigner: false;
        },
        {
          name: "player2";
          isMut: true;
          isSigner: false;
        },
        {
          name: "gameAuthority";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "cleanGame";
      accounts: [
        {
          name: "game";
          isMut: true;
          isSigner: false;
        },
        {
          name: "gameAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "cleaner";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rpsProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "game";
      type: {
        kind: "struct";
        fields: [
          {
            name: "seed";
            type: "u64";
          },
          {
            name: "wagerAmount";
            type: "u64";
          },
          {
            name: "state";
            type: {
              defined: "GameState";
            };
          }
        ];
      };
    }
  ];
  types: [
    {
      name: "GameConfig";
      type: {
        kind: "struct";
        fields: [
          {
            name: "entryProof";
            type: {
              option: {
                array: ["u8", 32];
              };
            };
          }
        ];
      };
    },
    {
      name: "RPS";
      type: {
        kind: "enum";
        variants: [
          {
            name: "Rock";
          },
          {
            name: "Paper";
          },
          {
            name: "Scissors";
          }
        ];
      };
    },
    {
      name: "Winner";
      type: {
        kind: "enum";
        variants: [
          {
            name: "P1";
          },
          {
            name: "P2";
          },
          {
            name: "TIE";
          }
        ];
      };
    },
    {
      name: "PlayerState";
      type: {
        kind: "enum";
        variants: [
          {
            name: "Committed";
            fields: [
              {
                name: "pubkey";
                type: "publicKey";
              },
              {
                name: "commitment";
                type: {
                  array: ["u8", 32];
                };
              }
            ];
          },
          {
            name: "Revealed";
            fields: [
              {
                name: "pubkey";
                type: "publicKey";
              },
              {
                name: "choice";
                type: {
                  defined: "RPS";
                };
              }
            ];
          }
        ];
      };
    },
    {
      name: "GameState";
      type: {
        kind: "enum";
        variants: [
          {
            name: "Initialized";
          },
          {
            name: "AcceptingChallenge";
            fields: [
              {
                name: "config";
                type: {
                  defined: "GameConfig";
                };
              },
              {
                name: "player_1";
                type: {
                  defined: "PlayerState";
                };
              },
              {
                name: "expiry_slot";
                type: "u64";
              }
            ];
          },
          {
            name: "AcceptingReveal";
            fields: [
              {
                name: "player_1";
                type: {
                  defined: "PlayerState";
                };
              },
              {
                name: "player_2";
                type: {
                  defined: "PlayerState";
                };
              },
              {
                name: "config";
                type: {
                  defined: "GameConfig";
                };
              },
              {
                name: "expiry_slot";
                type: "u64";
              }
            ];
          },
          {
            name: "AcceptingSettle";
            fields: [
              {
                name: "result";
                type: {
                  defined: "Winner";
                };
              },
              {
                name: "player_1";
                type: {
                  defined: "PlayerState";
                };
              },
              {
                name: "player_2";
                type: {
                  defined: "PlayerState";
                };
              },
              {
                name: "config";
                type: {
                  defined: "GameConfig";
                };
              }
            ];
          },
          {
            name: "Settled";
            fields: [
              {
                name: "result";
                type: {
                  defined: "Winner";
                };
              },
              {
                name: "player_1";
                type: {
                  defined: "PlayerState";
                };
              },
              {
                name: "player_2";
                type: {
                  defined: "PlayerState";
                };
              },
              {
                name: "config";
                type: {
                  defined: "GameConfig";
                };
              }
            ];
          }
        ];
      };
    },
    {
      name: "Actions";
      type: {
        kind: "enum";
        variants: [
          {
            name: "CreateGame";
            fields: [
              {
                name: "player_1_pubkey";
                type: "publicKey";
              },
              {
                name: "commitment";
                type: {
                  array: ["u8", 32];
                };
              },
              {
                name: "config";
                type: {
                  defined: "GameConfig";
                };
              }
            ];
          },
          {
            name: "JoinGame";
            fields: [
              {
                name: "player_2_pubkey";
                type: "publicKey";
              },
              {
                name: "choice";
                type: {
                  defined: "RPS";
                };
              },
              {
                name: "secret";
                type: {
                  option: "u64";
                };
              }
            ];
          },
          {
            name: "Reveal";
            fields: [
              {
                name: "player_1_pubkey";
                type: "publicKey";
              },
              {
                name: "salt";
                type: "u64";
              },
              {
                name: "choice";
                type: {
                  defined: "RPS";
                };
              }
            ];
          },
          {
            name: "ExpireGame";
            fields: [
              {
                name: "player_pubkey";
                type: "publicKey";
              }
            ];
          },
          {
            name: "Settle";
          }
        ];
      };
    }
  ];
  events: [
    {
      name: "GameStartEvent";
      fields: [
        {
          name: "gamePubkey";
          type: "publicKey";
          index: false;
        },
        {
          name: "wagerAmount";
          type: "u64";
          index: false;
        },
        {
          name: "public";
          type: "bool";
          index: false;
        }
      ];
    }
  ];
};

export const IDL: Rps = {
  version: "0.1.0",
  name: "rps",
  instructions: [
    {
      name: "createGame",
      accounts: [
        {
          name: "game",
          isMut: true,
          isSigner: false,
        },
        {
          name: "player",
          isMut: true,
          isSigner: true,
        },
        {
          name: "gameAuthority",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "gameSeed",
          type: "u64",
        },
        {
          name: "commitment",
          type: {
            array: ["u8", 32],
          },
        },
        {
          name: "wagerAmount",
          type: "u64",
        },
        {
          name: "entryProof",
          type: {
            option: {
              array: ["u8", 32],
            },
          },
        },
      ],
    },
    {
      name: "joinGame",
      accounts: [
        {
          name: "player",
          isMut: true,
          isSigner: true,
        },
        {
          name: "game",
          isMut: true,
          isSigner: false,
        },
        {
          name: "gameAuthority",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "choice",
          type: {
            defined: "RPS",
          },
        },
        {
          name: "secret",
          type: {
            option: "u64",
          },
        },
      ],
    },
    {
      name: "revealGame",
      accounts: [
        {
          name: "game",
          isMut: true,
          isSigner: false,
        },
        {
          name: "player",
          isMut: false,
          isSigner: true,
        },
      ],
      args: [
        {
          name: "choice",
          type: {
            defined: "RPS",
          },
        },
        {
          name: "salt",
          type: "u64",
        },
      ],
    },
    {
      name: "expireGame",
      accounts: [
        {
          name: "game",
          isMut: true,
          isSigner: false,
        },
        {
          name: "player",
          isMut: false,
          isSigner: false,
          docs: [
            "checked in the game logic code so this doesn't need to be a signer",
          ],
        },
      ],
      args: [],
    },
    {
      name: "settleGame",
      accounts: [
        {
          name: "game",
          isMut: true,
          isSigner: false,
        },
        {
          name: "player1",
          isMut: true,
          isSigner: false,
        },
        {
          name: "player2",
          isMut: true,
          isSigner: false,
        },
        {
          name: "gameAuthority",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "cleanGame",
      accounts: [
        {
          name: "game",
          isMut: true,
          isSigner: false,
        },
        {
          name: "gameAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "cleaner",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rpsProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "game",
      type: {
        kind: "struct",
        fields: [
          {
            name: "seed",
            type: "u64",
          },
          {
            name: "wagerAmount",
            type: "u64",
          },
          {
            name: "state",
            type: {
              defined: "GameState",
            },
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "GameConfig",
      type: {
        kind: "struct",
        fields: [
          {
            name: "entryProof",
            type: {
              option: {
                array: ["u8", 32],
              },
            },
          },
        ],
      },
    },
    {
      name: "RPS",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Rock",
          },
          {
            name: "Paper",
          },
          {
            name: "Scissors",
          },
        ],
      },
    },
    {
      name: "Winner",
      type: {
        kind: "enum",
        variants: [
          {
            name: "P1",
          },
          {
            name: "P2",
          },
          {
            name: "TIE",
          },
        ],
      },
    },
    {
      name: "PlayerState",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Committed",
            fields: [
              {
                name: "pubkey",
                type: "publicKey",
              },
              {
                name: "commitment",
                type: {
                  array: ["u8", 32],
                },
              },
            ],
          },
          {
            name: "Revealed",
            fields: [
              {
                name: "pubkey",
                type: "publicKey",
              },
              {
                name: "choice",
                type: {
                  defined: "RPS",
                },
              },
            ],
          },
        ],
      },
    },
    {
      name: "GameState",
      type: {
        kind: "enum",
        variants: [
          {
            name: "Initialized",
          },
          {
            name: "AcceptingChallenge",
            fields: [
              {
                name: "config",
                type: {
                  defined: "GameConfig",
                },
              },
              {
                name: "player_1",
                type: {
                  defined: "PlayerState",
                },
              },
              {
                name: "expiry_slot",
                type: "u64",
              },
            ],
          },
          {
            name: "AcceptingReveal",
            fields: [
              {
                name: "player_1",
                type: {
                  defined: "PlayerState",
                },
              },
              {
                name: "player_2",
                type: {
                  defined: "PlayerState",
                },
              },
              {
                name: "config",
                type: {
                  defined: "GameConfig",
                },
              },
              {
                name: "expiry_slot",
                type: "u64",
              },
            ],
          },
          {
            name: "AcceptingSettle",
            fields: [
              {
                name: "result",
                type: {
                  defined: "Winner",
                },
              },
              {
                name: "player_1",
                type: {
                  defined: "PlayerState",
                },
              },
              {
                name: "player_2",
                type: {
                  defined: "PlayerState",
                },
              },
              {
                name: "config",
                type: {
                  defined: "GameConfig",
                },
              },
            ],
          },
          {
            name: "Settled",
            fields: [
              {
                name: "result",
                type: {
                  defined: "Winner",
                },
              },
              {
                name: "player_1",
                type: {
                  defined: "PlayerState",
                },
              },
              {
                name: "player_2",
                type: {
                  defined: "PlayerState",
                },
              },
              {
                name: "config",
                type: {
                  defined: "GameConfig",
                },
              },
            ],
          },
        ],
      },
    },
    {
      name: "Actions",
      type: {
        kind: "enum",
        variants: [
          {
            name: "CreateGame",
            fields: [
              {
                name: "player_1_pubkey",
                type: "publicKey",
              },
              {
                name: "commitment",
                type: {
                  array: ["u8", 32],
                },
              },
              {
                name: "config",
                type: {
                  defined: "GameConfig",
                },
              },
            ],
          },
          {
            name: "JoinGame",
            fields: [
              {
                name: "player_2_pubkey",
                type: "publicKey",
              },
              {
                name: "choice",
                type: {
                  defined: "RPS",
                },
              },
              {
                name: "secret",
                type: {
                  option: "u64",
                },
              },
            ],
          },
          {
            name: "Reveal",
            fields: [
              {
                name: "player_1_pubkey",
                type: "publicKey",
              },
              {
                name: "salt",
                type: "u64",
              },
              {
                name: "choice",
                type: {
                  defined: "RPS",
                },
              },
            ],
          },
          {
            name: "ExpireGame",
            fields: [
              {
                name: "player_pubkey",
                type: "publicKey",
              },
            ],
          },
          {
            name: "Settle",
          },
        ],
      },
    },
  ],
  events: [
    {
      name: "GameStartEvent",
      fields: [
        {
          name: "gamePubkey",
          type: "publicKey",
          index: false,
        },
        {
          name: "wagerAmount",
          type: "u64",
          index: false,
        },
        {
          name: "public",
          type: "bool",
          index: false,
        },
      ],
    },
  ],
};
