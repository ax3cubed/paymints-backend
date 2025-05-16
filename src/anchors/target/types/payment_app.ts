/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/payment_app.json`.
 */
export type PaymentApp = {
  "address": "AbTJtQd7JJcqQ4YRCxV8RpE1MV3yFw8gbjwgrjJHKQ2D",
  "metadata": {
    "name": "paymentApp",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "claimVestedTokens",
      "discriminator": [
        165,
        219,
        11,
        0,
        187,
        52,
        142,
        199
      ],
      "accounts": [
        {
          "name": "vestingAccount",
          "writable": true
        },
        {
          "name": "vaultTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vestingAccount"
              }
            ]
          }
        },
        {
          "name": "vaultAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vestingAccount"
              }
            ]
          }
        },
        {
          "name": "employeeTokenAccount",
          "writable": true
        },
        {
          "name": "employee",
          "writable": true,
          "signer": true,
          "relations": [
            "vestingAccount"
          ]
        },
        {
          "name": "mint",
          "relations": [
            "vestingAccount"
          ]
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "closeInvoice",
      "discriminator": [
        217,
        64,
        46,
        247,
        231,
        36,
        118,
        252
      ],
      "accounts": [
        {
          "name": "issuer",
          "writable": true,
          "signer": true,
          "relations": [
            "invoice"
          ]
        },
        {
          "name": "invoice",
          "writable": true
        },
        {
          "name": "mint"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "createInvoice",
      "discriminator": [
        154,
        170,
        31,
        135,
        134,
        100,
        156,
        146
      ],
      "accounts": [
        {
          "name": "issuer",
          "writable": true,
          "signer": true
        },
        {
          "name": "invoice",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  110,
                  118,
                  111,
                  105,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "issuer"
              },
              {
                "kind": "arg",
                "path": "invoiceId"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "invoiceId",
          "type": "string"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "deadline",
          "type": "i64"
        },
        {
          "name": "mint",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "createVestingAccount",
      "discriminator": [
        129,
        178,
        2,
        13,
        217,
        172,
        230,
        218
      ],
      "accounts": [
        {
          "name": "employer",
          "writable": true,
          "signer": true
        },
        {
          "name": "employee"
        },
        {
          "name": "vestingAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  101,
                  115,
                  116,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "employer"
              },
              {
                "kind": "account",
                "path": "employee"
              }
            ]
          }
        },
        {
          "name": "employerTokenAccount",
          "writable": true
        },
        {
          "name": "vaultTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vestingAccount"
              }
            ]
          }
        },
        {
          "name": "vaultAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "vestingAccount"
              }
            ]
          }
        },
        {
          "name": "employeeTokenAccount",
          "writable": true
        },
        {
          "name": "mint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "isVesting",
          "type": "bool"
        },
        {
          "name": "vestUntil",
          "type": "i64"
        }
      ]
    },
    {
      "name": "depositToPool",
      "discriminator": [
        99,
        136,
        15,
        66,
        85,
        146,
        24,
        89
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "poolAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "contributorAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  105,
                  98,
                  117,
                  116,
                  111,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "poolTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "poolAccount"
              }
            ]
          }
        },
        {
          "name": "poolAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "payInvoice",
      "discriminator": [
        104,
        6,
        62,
        239,
        197,
        206,
        208,
        220
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "invoice",
          "writable": true
        },
        {
          "name": "payerTokenAccount",
          "writable": true
        },
        {
          "name": "issuerTokenAccount",
          "writable": true
        },
        {
          "name": "paymentLog",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  121,
                  109,
                  101,
                  110,
                  116,
                  95,
                  108,
                  111,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "invoice"
              },
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "sendTokens",
      "discriminator": [
        52,
        223,
        177,
        235,
        135,
        171,
        73,
        96
      ],
      "accounts": [
        {
          "name": "sender",
          "writable": true,
          "signer": true
        },
        {
          "name": "senderTokenAccount",
          "writable": true
        },
        {
          "name": "recipientTokenAccount",
          "writable": true
        },
        {
          "name": "mint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawFromPool",
      "discriminator": [
        62,
        33,
        128,
        81,
        40,
        234,
        29,
        77
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "poolAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "contributorAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  105,
                  98,
                  117,
                  116,
                  111,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "poolTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "poolAccount"
              }
            ]
          }
        },
        {
          "name": "poolAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "contributorAccount",
      "discriminator": [
        14,
        30,
        60,
        53,
        185,
        245,
        180,
        86
      ]
    },
    {
      "name": "invoice",
      "discriminator": [
        51,
        194,
        250,
        114,
        6,
        104,
        18,
        164
      ]
    },
    {
      "name": "paymentLog",
      "discriminator": [
        189,
        216,
        158,
        213,
        220,
        130,
        122,
        143
      ]
    },
    {
      "name": "poolAccount",
      "discriminator": [
        116,
        210,
        187,
        119,
        196,
        196,
        52,
        137
      ]
    },
    {
      "name": "vestingAccount",
      "discriminator": [
        102,
        73,
        10,
        233,
        200,
        188,
        228,
        216
      ]
    }
  ],
  "events": [
    {
      "name": "invoiceClosed",
      "discriminator": [
        73,
        15,
        241,
        78,
        178,
        104,
        112,
        196
      ]
    },
    {
      "name": "invoiceCreated",
      "discriminator": [
        189,
        114,
        235,
        219,
        193,
        125,
        47,
        54
      ]
    },
    {
      "name": "paymentMade",
      "discriminator": [
        227,
        251,
        123,
        16,
        133,
        220,
        83,
        242
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "alreadyClaimed",
      "msg": "Tokens have already been claimed"
    },
    {
      "code": 6001,
      "name": "notAVestedAccount",
      "msg": "Not a vested token account"
    },
    {
      "code": 6002,
      "name": "vestingPeriodNotReached",
      "msg": "Vesting period not yet reached"
    },
    {
      "code": 6003,
      "name": "invalidAmount",
      "msg": "Invalid token amount"
    },
    {
      "code": 6004,
      "name": "invalidVestingPeriod",
      "msg": "Invalid vesting period"
    },
    {
      "code": 6005,
      "name": "invalidTokenAccount",
      "msg": "Invalid token account"
    },
    {
      "code": 6006,
      "name": "invalidMint",
      "msg": "Invalid mint"
    },
    {
      "code": 6007,
      "name": "invalidEmployee",
      "msg": "Invalid employee"
    },
    {
      "code": 6008,
      "name": "insufficientContribution",
      "msg": "Insufficient contribution balance"
    },
    {
      "code": 6009,
      "name": "insufficientPoolBalance",
      "msg": "Insufficient pool balance"
    },
    {
      "code": 6010,
      "name": "invoiceClosed",
      "msg": "Invoice is already closed"
    },
    {
      "code": 6011,
      "name": "invoiceExpired",
      "msg": "Invoice has expired"
    },
    {
      "code": 6012,
      "name": "invalidInvoiceId",
      "msg": "Invalid invoice ID"
    },
    {
      "code": 6013,
      "name": "invalidDescription",
      "msg": "Invalid description"
    },
    {
      "code": 6014,
      "name": "invalidDeadline",
      "msg": "Invalid deadline"
    },
    {
      "code": 6015,
      "name": "unauthorized",
      "msg": "Unauthorized action"
    },
    {
      "code": 6016,
      "name": "arithmeticOverflow",
      "msg": "Arithmetic overflow"
    }
  ],
  "types": [
    {
      "name": "contributorAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "invoice",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "issuer",
            "type": "pubkey"
          },
          {
            "name": "invoiceId",
            "type": "string"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "deadline",
            "type": "i64"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "totalPaid",
            "type": "u64"
          },
          {
            "name": "isClosed",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "invoiceClosed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "invoice",
            "type": "pubkey"
          },
          {
            "name": "issuer",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "invoiceCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "invoice",
            "type": "pubkey"
          },
          {
            "name": "issuer",
            "type": "pubkey"
          },
          {
            "name": "invoiceId",
            "type": "string"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "deadline",
            "type": "i64"
          },
          {
            "name": "mint",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "paymentLog",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "payer",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "invoice",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "paymentMade",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "invoice",
            "type": "pubkey"
          },
          {
            "name": "payer",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "poolAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "totalDeposited",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "vestingAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "employer",
            "type": "pubkey"
          },
          {
            "name": "employee",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "isVesting",
            "type": "bool"
          },
          {
            "name": "vestUntil",
            "type": "i64"
          },
          {
            "name": "claimed",
            "type": "bool"
          }
        ]
      }
    }
  ]
};
