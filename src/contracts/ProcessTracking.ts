export const contractAbi = [
    {
        type: "function",
        name: "addLog",
        inputs: [
            {
                name: "seasonStepId",
                type: "uint64",
                internalType: "uint64"
            },
            {
                name: "logId",
                type: "uint64",
                internalType: "uint64"
            },
            {
                name: "hashedData",
                type: "string",
                internalType: "string"
            }
        ],
        outputs: [],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        name: "addStep",
        inputs: [
            {
                name: "seasonId",
                type: "uint64",
                internalType: "uint64"
            },
            {
                name: "seasonStepId",
                type: "uint64",
                internalType: "uint64"
            },
            {
                name: "hashedData",
                type: "string",
                internalType: "string"
            }
        ],
        outputs: [],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        name: "getLog",
        inputs: [
            {
                name: "logId",
                type: "uint64",
                internalType: "uint64"
            }
        ],
        outputs: [
            {
                name: "",
                type: "string",
                internalType: "string"
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "getLogs",
        inputs: [
            {
                name: "seasonStepId",
                type: "uint64",
                internalType: "uint64"
            }
        ],
        outputs: [
            {
                name: "",
                type: "uint64[]",
                internalType: "uint64[]"
            },
            {
                name: "",
                type: "string[]",
                internalType: "string[]"
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "getStep",
        inputs: [
            {
                name: "seasonStepId",
                type: "uint64",
                internalType: "uint64"
            }
        ],
        outputs: [
            {
                name: "",
                type: "string",
                internalType: "string"
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "getSteps",
        inputs: [
            {
                name: "seasonId",
                type: "uint64",
                internalType: "uint64"
            }
        ],
        outputs: [
            {
                name: "",
                type: "uint64[]",
                internalType: "uint64[]"
            },
            {
                name: "",
                type: "string[]",
                internalType: "string[]"
            }
        ],
        stateMutability: "view"
    },
    {
        type: "event",
        name: "LogAdded",
        inputs: [
            {
                name: "logId",
                type: "uint64",
                indexed: false,
                internalType: "uint64"
            },
            {
                name: "hashedData",
                type: "string",
                indexed: false,
                internalType: "string"
            }
        ],
        anonymous: false
    },
    {
        type: "event",
        name: "StepAdded",
        inputs: [
            {
                name: "seasonId",
                type: "uint64",
                indexed: false,
                internalType: "uint64"
            },
            {
                name: "seasonStepId",
                type: "uint64",
                indexed: false,
                internalType: "uint64"
            },
            {
                name: "hashedData",
                type: "string",
                indexed: false,
                internalType: "string"
            }
        ],
        anonymous: false
    },
    {
        type: "error",
        name: "ProcessTracking__InvalidLogId",
        inputs: []
    },
    {
        type: "error",
        name: "ProcessTracking__InvalidStepId",
        inputs: []
    }
];