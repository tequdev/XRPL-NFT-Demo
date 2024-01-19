import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import { Xumm } from "xumm";
import MintPage from "./components/MintPage";
import NFTListPage from "./components/NFTListPage";

const xumm = new Xumm(process.env.REACT_APP_XUMM_API_KEY!);

function App() {
  const [account, setAccount] = useState<string>();
  const [tab,setTab] = useState<'mint'|'list'>('mint')

  const [status, setStatus] = useState<"loading" | "connected" | "unconnected">(
    "loading"
  );

  useEffect(() => {
    xumm.on('success', async () => {
      setStatus(await xumm.user.account ? 'connected' : 'unconnected')
    })

    xumm.environment.ready.then(async () => { 
      const account = await new Promise<string|undefined>(async (resolve) => {
        setTimeout(() => resolve(undefined), 1000);
        resolve((await xumm.user.account) || undefined);
      });
      // set connected status
      setAccount(account);
      setStatus(account ? "connected" : "unconnected");
    });
  }, []);

  const disconnect = useCallback(async () => {
    await xumm.logout();
    setStatus("unconnected");
  }, []);
  
  const selectTab = (tab: 'mint'| 'list') => {
    setTab(tab)
  }

  return (
    <div className="p-4 mt-8 md:mt-24 text-center">
      <div className="text-4xl my-8 break-all flex items-center flex-col">
        Xahau NFT Demo
        <div className="flex justify-end text-sm max-w-sm w-full">
          {status === "connected" && (
            <button className="btn btn-sm btn-outline" onClick={disconnect}>
              Logout
            </button>
          )}
        </div>
      </div>
      <div className="flex justify-center">
        {status === "unconnected" && (
          <button className="btn btn-primary" onClick={xumm.authorize}>
            Connect Wallet
          </button>
        )}
        {status === "connected" && (
          <div className="w-[320px]">
            <div className="tabs">
              <div
                className={`tab tab-lifted  tab-lg cursor-pointer w-1/2 ${
                  tab === "mint" ? "tab-active" : ""
                }`}
                onClick={() => selectTab("mint")}
              >
                Mint
              </div>
              <div
                className={`tab tab-lifted tab-lg cursor-pointer w-1/2 ${
                  tab === "list" ? "tab-active" : ""
                }`}
                onClick={() => selectTab("list")}
              >
                NFTs
              </div>
            </div>
            {tab === "mint" && <MintPage xumm={xumm} account={account} />}
            {tab === "list" && <NFTListPage account={account!} />}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
