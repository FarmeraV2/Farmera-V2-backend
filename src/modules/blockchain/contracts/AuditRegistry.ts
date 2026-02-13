export const auditRegistryAbi = [
    {
        type: "constructor",
        inputs: [
            {
                name: "_priceFeedAddress",
                type: "address",
                internalType: "address"
            },
            {
                name: "_vrfCoordinator",
                type: "address",
                internalType: "address"
            },
            {
                name: "_keyHash",
                type: "bytes32",
                internalType: "bytes32"
            },
            {
                name: "_subscriptionId",
                type: "uint256",
                internalType: "uint256"
            },
            {
                name: "_callbackGasLimit",
                type: "uint32",
                internalType: "uint32"
            }
        ],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        name: "MIN_AUDITORS",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "uint256",
                internalType: "uint256"
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "acceptOwnership",
        inputs: [],
        outputs: [],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        name: "finalizeExpired",
        inputs: [
            {
                name: "identifier",
                type: "bytes32",
                internalType: "bytes32"
            },
            {
                name: "id",
                type: "uint64",
                internalType: "uint64"
            }
        ],
        outputs: [],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        name: "finalized",
        inputs: [
            {
                name: "",
                type: "bytes32",
                internalType: "bytes32"
            },
            {
                name: "",
                type: "uint64",
                internalType: "uint64"
            }
        ],
        outputs: [
            {
                name: "",
                type: "bool",
                internalType: "bool"
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "getAuditor",
        inputs: [
            {
                name: "auditor",
                type: "address",
                internalType: "address"
            }
        ],
        outputs: [
            {
                name: "",
                type: "tuple",
                internalType: "struct AuditorRegistry.Auditor",
                components: [
                    {
                        name: "isActive",
                        type: "bool",
                        internalType: "bool"
                    },
                    {
                        name: "auditorAddress",
                        type: "address",
                        internalType: "address"
                    },
                    {
                        name: "reputationScore",
                        type: "uint256",
                        internalType: "uint256"
                    },
                    {
                        name: "stakedTokens",
                        type: "uint256",
                        internalType: "uint256"
                    },
                    {
                        name: "name",
                        type: "string",
                        internalType: "string"
                    }
                ]
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "getVerificationAssignments",
        inputs: [
            {
                name: "identifier",
                type: "bytes32",
                internalType: "bytes32"
            },
            {
                name: "id",
                type: "uint64",
                internalType: "uint64"
            }
        ],
        outputs: [
            {
                name: "",
                type: "address[]",
                internalType: "address[]"
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "getVerificationDeadline",
        inputs: [
            {
                name: "identifier",
                type: "bytes32",
                internalType: "bytes32"
            },
            {
                name: "id",
                type: "uint64",
                internalType: "uint64"
            }
        ],
        outputs: [
            {
                name: "",
                type: "uint256",
                internalType: "uint256"
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "getVerificationResult",
        inputs: [
            {
                name: "identifier",
                type: "bytes32",
                internalType: "bytes32"
            },
            {
                name: "id",
                type: "uint64",
                internalType: "uint64"
            }
        ],
        outputs: [
            {
                name: "",
                type: "bool",
                internalType: "bool"
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "getVerifications",
        inputs: [
            {
                name: "identifier",
                type: "bytes32",
                internalType: "bytes32"
            },
            {
                name: "id",
                type: "uint64",
                internalType: "uint64"
            }
        ],
        outputs: [
            {
                name: "",
                type: "tuple[]",
                internalType: "struct AuditorRegistry.Verification[]",
                components: [
                    {
                        name: "isValid",
                        type: "bool",
                        internalType: "bool"
                    },
                    {
                        name: "auditor",
                        type: "address",
                        internalType: "address"
                    },
                    {
                        name: "timestamp",
                        type: "uint256",
                        internalType: "uint256"
                    }
                ]
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "owner",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "address",
                internalType: "address"
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "rawFulfillRandomWords",
        inputs: [
            {
                name: "requestId",
                type: "uint256",
                internalType: "uint256"
            },
            {
                name: "randomWords",
                type: "uint256[]",
                internalType: "uint256[]"
            }
        ],
        outputs: [],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        name: "registerAuditor",
        inputs: [
            {
                name: "name",
                type: "string",
                internalType: "string"
            }
        ],
        outputs: [],
        stateMutability: "payable"
    },
    {
        type: "function",
        name: "requestVerification",
        inputs: [
            {
                name: "identifier",
                type: "bytes32",
                internalType: "bytes32"
            },
            {
                name: "id",
                type: "uint64",
                internalType: "uint64"
            },
            {
                name: "deadline",
                type: "uint256",
                internalType: "uint256"
            }
        ],
        outputs: [],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        name: "requests",
        inputs: [
            {
                name: "",
                type: "uint256",
                internalType: "uint256"
            }
        ],
        outputs: [
            {
                name: "identifier",
                type: "bytes32",
                internalType: "bytes32"
            },
            {
                name: "id",
                type: "uint64",
                internalType: "uint64"
            },
            {
                name: "deadline",
                type: "uint256",
                internalType: "uint256"
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "s_vrfCoordinator",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "address",
                internalType: "contract IVRFCoordinatorV2Plus"
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "setCoordinator",
        inputs: [
            {
                name: "_vrfCoordinator",
                type: "address",
                internalType: "address"
            }
        ],
        outputs: [],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        name: "transferOwnership",
        inputs: [
            {
                name: "to",
                type: "address",
                internalType: "address"
            }
        ],
        outputs: [],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        name: "verificationResult",
        inputs: [
            {
                name: "",
                type: "bytes32",
                internalType: "bytes32"
            },
            {
                name: "",
                type: "uint64",
                internalType: "uint64"
            }
        ],
        outputs: [
            {
                name: "",
                type: "bool",
                internalType: "bool"
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "verify",
        inputs: [
            {
                name: "identifier",
                type: "bytes32",
                internalType: "bytes32"
            },
            {
                name: "id",
                type: "uint64",
                internalType: "uint64"
            },
            {
                name: "isValid",
                type: "bool",
                internalType: "bool"
            }
        ],
        outputs: [],
        stateMutability: "nonpayable"
    },
    {
        type: "event",
        name: "AuditorRegistered",
        inputs: [
            {
                name: "auditor",
                type: "address",
                indexed: true,
                internalType: "address"
            },
            {
                name: "name",
                type: "string",
                indexed: false,
                internalType: "string"
            },
            {
                name: "stakedTokens",
                type: "uint256",
                indexed: false,
                internalType: "uint256"
            }
        ],
        anonymous: false
    },
    {
        type: "event",
        name: "AuditorSlashed",
        inputs: [
            {
                name: "auditor",
                type: "address",
                indexed: true,
                internalType: "address"
            },
            {
                name: "amount",
                type: "uint256",
                indexed: false,
                internalType: "uint256"
            }
        ],
        anonymous: false
    },
    {
        type: "event",
        name: "CoordinatorSet",
        inputs: [
            {
                name: "vrfCoordinator",
                type: "address",
                indexed: false,
                internalType: "address"
            }
        ],
        anonymous: false
    },
    {
        type: "event",
        name: "OwnershipTransferRequested",
        inputs: [
            {
                name: "from",
                type: "address",
                indexed: true,
                internalType: "address"
            },
            {
                name: "to",
                type: "address",
                indexed: true,
                internalType: "address"
            }
        ],
        anonymous: false
    },
    {
        type: "event",
        name: "OwnershipTransferred",
        inputs: [
            {
                name: "from",
                type: "address",
                indexed: true,
                internalType: "address"
            },
            {
                name: "to",
                type: "address",
                indexed: true,
                internalType: "address"
            }
        ],
        anonymous: false
    },
    {
        type: "event",
        name: "VerificationFinalized",
        inputs: [
            {
                name: "identifier",
                type: "bytes32",
                indexed: true,
                internalType: "bytes32"
            },
            {
                name: "id",
                type: "uint64",
                indexed: true,
                internalType: "uint64"
            },
            {
                name: "consensus",
                type: "bool",
                indexed: false,
                internalType: "bool"
            },
            {
                name: "totalVote",
                type: "uint256",
                indexed: false,
                internalType: "uint256"
            }
        ],
        anonymous: false
    },
    {
        type: "event",
        name: "VerificationRequested",
        inputs: [
            {
                name: "identifier",
                type: "bytes32",
                indexed: true,
                internalType: "bytes32"
            },
            {
                name: "id",
                type: "uint64",
                indexed: true,
                internalType: "uint64"
            },
            {
                name: "assignedAuditors",
                type: "address[]",
                indexed: false,
                internalType: "address[]"
            },
            {
                name: "deadline",
                type: "uint256",
                indexed: false,
                internalType: "uint256"
            }
        ],
        anonymous: false
    },
    {
        type: "event",
        name: "VerificationSubmitted",
        inputs: [
            {
                name: "identifier",
                type: "bytes32",
                indexed: true,
                internalType: "bytes32"
            },
            {
                name: "id",
                type: "uint64",
                indexed: true,
                internalType: "uint64"
            },
            {
                name: "auditor",
                type: "address",
                indexed: true,
                internalType: "address"
            },
            {
                name: "isValid",
                type: "bool",
                indexed: false,
                internalType: "bool"
            }
        ],
        anonymous: false
    },
    {
        type: "error",
        name: "AuditorRegistry__AlreadyFinalized",
        inputs: [
            {
                name: "",
                type: "bytes32",
                internalType: "bytes32"
            },
            {
                name: "",
                type: "uint64",
                internalType: "uint64"
            }
        ]
    },
    {
        type: "error",
        name: "AuditorRegistry__AlreadyRegistered",
        inputs: [
            {
                name: "",
                type: "address",
                internalType: "address"
            }
        ]
    },
    {
        type: "error",
        name: "AuditorRegistry__AlreadyVerified",
        inputs: [
            {
                name: "",
                type: "address",
                internalType: "address"
            }
        ]
    },
    {
        type: "error",
        name: "AuditorRegistry__DeadlineExpired",
        inputs: [
            {
                name: "",
                type: "bytes32",
                internalType: "bytes32"
            },
            {
                name: "",
                type: "uint64",
                internalType: "uint64"
            }
        ]
    },
    {
        type: "error",
        name: "AuditorRegistry__InvalidAmount",
        inputs: [
            {
                name: "",
                type: "address",
                internalType: "address"
            }
        ]
    },
    {
        type: "error",
        name: "AuditorRegistry__InvalidAuditor",
        inputs: [
            {
                name: "",
                type: "address",
                internalType: "address"
            }
        ]
    },
    {
        type: "error",
        name: "AuditorRegistry__InvalidDeadline",
        inputs: []
    },
    {
        type: "error",
        name: "AuditorRegistry__NotAssigned",
        inputs: [
            {
                name: "",
                type: "address",
                internalType: "address"
            }
        ]
    },
    {
        type: "error",
        name: "AuditorRegistry__NotEnoughAuditor",
        inputs: []
    },
    {
        type: "error",
        name: "AuditorRegistry__VerificationNotExpired",
        inputs: [
            {
                name: "",
                type: "bytes32",
                internalType: "bytes32"
            },
            {
                name: "",
                type: "uint64",
                internalType: "uint64"
            }
        ]
    },
    {
        type: "error",
        name: "AuditorRegistry__VerificationPending",
        inputs: [
            {
                name: "",
                type: "bytes32",
                internalType: "bytes32"
            },
            {
                name: "",
                type: "uint64",
                internalType: "uint64"
            }
        ]
    },
    {
        type: "error",
        name: "OnlyCoordinatorCanFulfill",
        inputs: [
            {
                name: "have",
                type: "address",
                internalType: "address"
            },
            {
                name: "want",
                type: "address",
                internalType: "address"
            }
        ]
    },
    {
        type: "error",
        name: "OnlyOwnerOrCoordinator",
        inputs: [
            {
                name: "have",
                type: "address",
                internalType: "address"
            },
            {
                name: "owner",
                type: "address",
                internalType: "address"
            },
            {
                name: "coordinator",
                type: "address",
                internalType: "address"
            }
        ]
    },
    {
        type: "error",
        name: "ZeroAddress",
        inputs: []
    }
];