import React from "react";
import useSWRImmutable from "swr/immutable";
import { Buffer } from "buffer";

type AccountNft = {
  index: string;
  Owner: string;
  Issuer: string;
  URI: string;
};

type Props = {
  nft: AccountNft;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const cidToUrl = (cid: string) => {
  return `https://cloudflare-ipfs.com/ipfs/${cid.replace("ipfs://", "")}`
}

const ListedNFT = ({ nft }: Props) => {
  const cid = nft.URI ? Buffer.from(nft.URI, "hex").toString() : "";
  const { data } = useSWRImmutable(
    cidToUrl(cid),
    fetcher
  );
  const imageUri = data?.image? cidToUrl(data.image):''
  const title = data?.name || ''
  return (
    <a
      className="border-2 flex mb-1 hover:bg-slate-100 cursor-pointer"
      target="_blank"
      href={`https://xahauexplorer.com/nft/${nft.index}`}
      rel="noreferrer"
    >
      <img src={imageUri} alt={data?.name} className="w-16 h-16" />
      <div className="pl-3">
        <div className="text-left leading-8">
          {title.slice(0, 16)}
          {title.length > 16 ? ".." : ""}
        </div>
        <div className="leading-8">{nft.index.slice(0, 16)}...</div>
      </div>
    </a>
  );
};

export default ListedNFT;
