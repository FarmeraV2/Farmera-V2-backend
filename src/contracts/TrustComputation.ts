export const trustComputationContractAbi = [
    {
        type: "constructor",
        inputs: [
            {
                name: "metricSelectionAddress",
                type: "address",
                internalType: "address"
            }
        ],
        stateMutability: "nonpayable"
    },
    {
        type: "function",
        name: "getMetricSelection",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "address",
                internalType: "contract MetricSelection"
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "getTrustRecord",
        inputs: [
            {
                name: "logId",
                type: "uint64",
                internalType: "uint64"
            }
        ],
        outputs: [
            {
                name: "trustScore",
                type: "uint256",
                internalType: "uint256"
            },
            {
                name: "timestamp",
                type: "uint256",
                internalType: "uint256"
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "getTrustRecords",
        inputs: [
            {
                name: "logIds",
                type: "uint64[]",
                internalType: "uint64[]"
            }
        ],
        outputs: [
            {
                name: "",
                type: "uint256[]",
                internalType: "uint256[]"
            },
            {
                name: "",
                type: "uint256[]",
                internalType: "uint256[]"
            }
        ],
        stateMutability: "view"
    },
    {
        type: "function",
        name: "processData",
        inputs: [
            {
                name: "logId",
                type: "uint64",
                internalType: "uint64"
            },
            {
                name: "dataType",
                type: "string",
                internalType: "string"
            },
            {
                name: "context",
                type: "string",
                internalType: "string"
            },
            {
                name: "data",
                type: "bytes",
                internalType: "bytes"
            }
        ],
        outputs: [],
        stateMutability: "nonpayable"
    },
    {
        type: "event",
        name: "TrustProcessed",
        inputs: [
            {
                name: "logId",
                type: "uint64",
                "indexed": true,
                internalType: "uint64"
            },
            {
                name: "trustScore",
                type: "uint256",
                "indexed": false,
                internalType: "uint256"
            }
        ],
        anonymous: false
    },
    {
        type: "error",
        name: "TrustComputation__IdAlreadyProcessed",
        inputs: []
    },
    {
        type: "error",
        name: "TrustComputation__InvalidData",
        inputs: []
    },
    {
        type: "error",
        name: "TrustComputation__NoTrustPackage",
        inputs: []
    }
];