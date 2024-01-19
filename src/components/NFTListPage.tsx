import React, { useEffect, useState } from "react";
import { XrplClient } from "xrpl-client";
import ListedNFT from "./ListedNFT";

const client = new XrplClient('wss://xahau.org');
// const client = new XrplClient('wss://xahau-test.net');

type AccountNfts = {
  index: string;
  Owner: string;
  Issuer: string;
  URI: string;
}[];

type Props = {
  account: string;
};


const NFTListPage = ({ account }: Props) => {
  const [nfts, setNfts] = useState<AccountNfts>([]);

  useEffect(() => {
    const f = async () => {
      await client.ready();
      const response = await client.send({
        command: "account_objects",
        account,
      });
      console.log(response)
      const nfts = (response.account_objects as any[])
        .filter((obj) => obj.LedgerEntryType === "URIToken")
      setNfts(nfts);
    };
    f();
  }, [account]);

  return (
    <div className="my-2 w-full">
      {nfts.map((nft,i) => (
        <ListedNFT key={i} nft={nft} />
      ))}
        <a
          className="text-center flex mb-1 cursor-pointer hover:link hover:link-primary"
          target="_blank"
          href={`https://xahauexplorer.com/nft-explorer?issuer=${account}`}
          rel="noreferrer"
          >more nfts...</a>
    </div>
  );
};

export default NFTListPage;
