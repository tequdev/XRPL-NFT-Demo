import React, { useEffect, useState } from "react";
import { XrplClient } from "xrpl-client";
import ListedNFT from "./ListedNFT";

const client = new XrplClient();

type AccountNfts = {
  Issuer: string;
  NFTokenID: string;
  NFTokenTaxon: number;
  nft_serial: number;
  flags: number;
  TransferFee: number;
  URI?: string;
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
        command: "account_nfts",
        account,
      });
      const nfts = (response.account_nfts as AccountNfts)
        .filter((nft) => nft.Issuer === account)
        .sort((a, b) => a.nft_serial - b.nft_serial);
      setNfts(nfts);
    };
    f();
  }, [account]);

  return (
    <div className="my-2">
      {nfts.map((nft) => (
        <ListedNFT key={nft.NFTokenID} nft={nft} />
      ))}
    </div>
  );
};

export default NFTListPage;
