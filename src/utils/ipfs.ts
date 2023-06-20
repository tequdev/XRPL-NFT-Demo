import { NFTStorage, File } from "nft.storage";
const NFT_STORAGE_TOKEN = process.env.REACT_APP_NFT_STORAGE_API_KEY!;
const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });

type Metadata = {
  name: string,
  description: string
}

export const uploadToIpfs = async (file: File, meta: Metadata) => {
  const extension = file.name.split('.').pop()!
  const imageFile = new File([file], `nft.${extension}`, {
    type: file.type,
  });
  const metadata = await client.store({
    ...meta,
    image: imageFile,
  });
  return metadata.url;
};
