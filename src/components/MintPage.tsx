import React, {
  FormEventHandler,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { Xumm } from "xumm";
import { Buffer } from "buffer";
import { XrplClient } from "xrpl-client";
import { windowOpen } from "../utils/windowOpen.";
import { ImageUploader } from "./ImageUploader";
import { uploadToIpfs } from "../utils/ipfs";
/// @ts-ignore
import { extractAffectedNFT } from "@xrplkit/txmeta";

const ROYALTIES = [0, 1, 5, 10] as const;

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
  const taxonRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);

  const [mintedToken, setMintedToken] = useState<MintedToken>();
  const [sbt, setSbt] = useState(false);

  const [royalty, setRoyalty] = useState<(typeof ROYALTIES)[number]>(0);

  const taxon = useMemo(() => parseInt(taxonRef.current?.value || "0"), []);
  const transferFee = useMemo(() => royalty * 1000, [royalty]);
  const metadata = useMemo(
    () => ({
      name: nameRef.current?.value || "",
      description: descriptionRef.current?.value || "",
    }),
    []
  );

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

        const _uri = await uploadToIpfs(imageRef.current.files[0]!, metadata);
        const uri = Buffer.from(_uri, "utf8").toString("hex").toUpperCase();

        const payload = {
          TransactionType: "NFTokenMint",
          NFTokenTaxon: taxon,
          URI: uri,
          ...(sbt ? { Flags: 8, TransferFee: transferFee } : {}),
        } as const;

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
        const txResponse = await client.send({
          command: "tx",
          transaction: txid,
        });
        const tokenId = extractAffectedNFT(txResponse);
        console.log({ tokenId });
        setMintedToken({
          tokenId,
          network: environment_nodetype!,
        });
      } catch (e: any) {
        alert(e.message);
      } finally {
        setLoading(false);
      }
    },
    [metadata, sbt, taxon, transferFee, xumm]
  );

  const openPage = useCallback(() => {
    if (!mintedToken) return;
    if (mintedToken.network === "MAINNET") {
      window.open(`https://xrp.cafe/nft/${mintedToken.tokenId}`, "_blank");
    } else if (mintedToken.network === "TESTNET") {
      window.open(
        `https://test.bithomp.com/nft/${mintedToken.tokenId}`,
        "_blank"
      );
    } else if (mintedToken.network === "DEVNET") {
      window.open(
        `https://dev.bithomp.com/nft/${mintedToken.tokenId}`,
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
        <span className="mt-4 -mb-2">NFT Info</span>
        {/* Taxon */}
        <label className="label pb-0">
          <span className="label-text">Collectio No</span>
        </label>
        <input
          ref={taxonRef}
          type="text"
          inputMode="numeric"
          min={0}
          max={4294967295}
          className="input input-bordered w-full max-w-xs"
          pattern="^[0-9]+$"
          title="0〜4294967295の数値で入力してください。"
          required
        />
        {/* SBT */}
        <label className="label cursor-pointer mt-2">
          <span>SBT</span>
          <input
            type="checkbox"
            checked={sbt}
            onChange={() => setSbt(!sbt)}
            className="checkbox"
          />
        </label>
        {!sbt && (
          // Royalty
          <>
            <label className="label pb-0">
              <span className="label-text">Royalty</span>
            </label>
            <div className="btn-group w-full">
              {ROYALTIES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoyalty(r)}
                  className={`btn btn-outline border-gray-300 w-1/4 ${
                    royalty === r ? "btn-active" : ""
                  }`}
                >
                  {r}%
                </button>
              ))}
            </div>
          </>
        )}
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
