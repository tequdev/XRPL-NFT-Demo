import React, {
  FormEventHandler,
  useCallback,
  useRef,
  useState,
} from "react";
import { Xumm } from "xumm";
import { Buffer } from "buffer";
import { AnyJson, XrplClient } from "xrpl-client";
import { windowOpen } from "../utils/windowOpen.";
import { ImageUploader } from "./ImageUploader";
import { uploadToIpfs } from "../utils/ipfs";

type MintedToken = {
  tokenId: string;
  network: string;
};

type Props = {
  xumm: Xumm;
  account?: string;
};

function MintPage({ xumm, account }: Props) {
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);

  const [mintedToken, setMintedToken] = useState<MintedToken>();


  const mint: FormEventHandler<HTMLButtonElement> = useCallback(
    async (event) => {
      event.preventDefault();
      setLoading(true);
      setMintedToken(undefined);
      try {
        if (!formRef.current?.checkValidity()) {
          formRef.current?.reportValidity();
          return;
        }
        if (!imageRef.current?.files) {
          alert("Please select an Image.");
          return;
        }
        
        const metadata = {
          name: nameRef.current?.value || "",
          description: descriptionRef.current?.value || "",
        }

        const _uri = await uploadToIpfs(imageRef.current.files[0]!, metadata);
        const uri = Buffer.from(_uri, "utf8").toString("hex").toUpperCase();
        const payload = {
          TransactionType: "URITokenMint",
          NetworkID: 21337,
          URI: uri,
        } as any;

        const response = await xumm.payload?.create(payload);
        if (!response) return;
        const {
          uuid,
          next: { always: url },
        } = response;
        // open payload
        const pcWindowId = windowOpen(url);
        // get payload status
        const subscription = await xumm.payload?.subscribe(uuid);
        if (!subscription) return;
        subscription.websocket.onmessage = (message) => {
          // subscription websocket message from xumm
          if (message.data.toString().match(/signed/)) {
            // close popup window(pc)
            setTimeout(() => pcWindowId?.close(), 1500);
            const json = JSON.parse(message.data.toString());
            subscription.resolve(json.signed);
          }
        };
        await subscription.resolved;

        // get tx to retrieve nftokenId
        const result = await xumm.payload?.get(uuid);
        if (!result?.response.txid) return;
        const { txid, environment_nodeuri, environment_nodetype } = result.response;
        const client = new XrplClient(environment_nodeuri!);
        let txResponse: AnyJson | undefined = undefined
        do {
          if(txResponse=== undefined) await new Promise(resolve => setTimeout(resolve, 2000))
          txResponse = await client.send({
            command: "tx",
            transaction: txid,
            ledger_index: 'validated'
          });
        } while (!txResponse.validated)

        const tokenId = txResponse.meta.AffectedNodes.find((node: Record<string,any>)=> 'CreatedNode' in node && node.CreatedNode.LedgerEntryType === 'URIToken')?.CreatedNode.LedgerIndex
        console.log({ tokenId });
        setMintedToken({
          tokenId,
          network: environment_nodetype!,
        });
      } catch (e: any) {
        console.error(e)
        alert(e.message);
      } finally {
        setLoading(false);
      }
    },
    [xumm]
  );

  const openPage = useCallback(() => {
    if (!mintedToken) return;

    if (mintedToken.network === "XAHAU" || mintedToken.network === "XAHAUMAINNET") {
      window.open(`https://xahauexplorer.com/nft/${mintedToken.tokenId}`, "_blank");
    } else if (mintedToken.network === "XAHAUTESTNET") {
      window.open(
        `https://test.xahauexplorer.com/nft/${mintedToken.tokenId}`,
        "_blank"
      );
    } else {
      alert("Unsupported network.");
    }
  }, [mintedToken]);

  return (
    <div className="flex flex-col gap-1 w-full max-w-xs mb-12">
      <form ref={formRef} className="form-control">
        <ImageUploader _ref={imageRef} />
        {/* Metadata */}
        <span className="mt-4 -mb-2">NFT Metadata</span>
        {/* name */}
        <label className="label pb-0">
          <span className="label-text">Name</span>
        </label>
        <input
          ref={nameRef}
          type="text"
          inputMode="text"
          className="input input-bordered w-full max-w-xs"
          required
        />
        {/* description */}
        <label className="label pb-0">
          <span className="label-text">Description</span>
        </label>
        <input
          ref={descriptionRef}
          type="text"
          inputMode="text"
          className="input input-bordered w-full max-w-xs"
          required
        />
        <button type="submit" className="mt-4 btn btn-primary" onClick={mint} disabled={loading}>
          {!loading ? 'Mint' : 'Loading...'}
        </button>
        {mintedToken && (
          <div className="mt-8">
            <button
              type="button"
              className="w-full btn btn-outline btn-success"
              onClick={openPage}
            >
              Open NFT Page
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default MintPage;
