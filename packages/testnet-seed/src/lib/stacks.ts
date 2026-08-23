import { createClient } from "@stacks/blockchain-api-client";
import { STACKS_TESTNET, clientFromNetwork } from "@stacks/network";
import {
  broadcastTransaction,
  type ClarityValue,
  makeContractCall,
  makeContractDeploy,
} from "@stacks/transactions";
import { generateNewAccount, generateWallet } from "@stacks/wallet-sdk";
import { readFileSync } from "node:fs";
import { parse } from "smol-toml";
import { sigleClient } from "./sigle.js";

const network = STACKS_TESTNET,
  apiClient = createClient({
    baseUrl: clientFromNetwork(network).baseUrl,
  }),
  TX_POLL_INTERVAL_MS = 500,
  TX_MAX_POLL_COUNT = 120,
  waitForTransaction = async (txId: string) => {
    let pollCount = 0;
    while (pollCount < TX_MAX_POLL_COUNT) {
      const tx = await apiClient.GET("/extended/v1/tx/{tx_id}", {
        params: { path: { tx_id: txId } },
      });
      if (
        tx.response.ok &&
        tx.data &&
        (tx.data.tx_status === "success" ||
          tx.data.tx_status === "abort_by_response" ||
          tx.data.tx_status === "abort_by_post_condition")
      ) {
        return tx.data;
      }
      pollCount++;
      await new Promise((resolve) => {
        setTimeout(resolve, TX_POLL_INTERVAL_MS);
      });
    }
    throw new Error(
      `Transaction ${txId} timed out after ${TX_MAX_POLL_COUNT} polls`,
    );
  },
  configFile = readFileSync(
    "../../apps/contracts/settings/Testnet.toml",
    "utf-8",
  ),
  config = parse(configFile),
  // @ts-expect-error Not typed properly
  mnemonic = config.accounts.deployer.mnemonic;

let wallet = await generateWallet({
  secretKey: mnemonic,
  password: "",
});

while (wallet.accounts.length < 5) {
  wallet = generateNewAccount(wallet);
}

export const deployContract = async ({
  contractName,
  codeBody,
  accountIndex,
}: {
  contractName: string;
  codeBody: string;
  accountIndex: number;
}) => {
  const privateKey = wallet.accounts[accountIndex].stxPrivateKey,
    transaction = await makeContractDeploy({
      contractName,
      codeBody,
      senderKey: privateKey,
      network,
    }),
    broadcastResponse = await broadcastTransaction({ transaction });
  console.log("submitted tx", broadcastResponse);
};

export const publishPost = async ({
  metadataUri,
  accountIndex,
}: {
  metadataUri: string;
  accountIndex: number;
}) => {
  const privateKey = wallet.accounts[accountIndex].stxPrivateKey,
    { parameters } = sigleClient.publishPost({
      metadataUri,
    }),
    transaction = await makeContractCall({
      ...parameters,
      contractAddress: parameters.contract.split(".")[0],
      contractName: parameters.contract.split(".")[1],
      functionArgs: parameters.functionArgs as ClarityValue[],
      network,
      senderKey: privateKey,
    }),
    broadcastResponse = await broadcastTransaction({ transaction });
  console.log("submitted tx", broadcastResponse);

  await waitForTransaction(broadcastResponse.txid);
  console.log("transaction confirmed", broadcastResponse.txid);
  return broadcastResponse.txid;
};

export { network };
