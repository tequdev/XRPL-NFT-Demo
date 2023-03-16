import React, { FormEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Xumm } from 'xumm';
import { Buffer } from 'buffer';
import { XrplClient } from 'xrpl-client'
import { parser } from './utils/parser';
import { windowOpen } from './utils/windowOpen.';

const xumm = new Xumm(process.env.REACT_APP_XUMM_API_KEY!)
const ROYALTIES = [0, 1, 5, 10] as const

type MintedToken = {
  tokenId: string
  network: string
}

function App() {
  const formRef = useRef<HTMLFormElement>(null)
  const uriRef = useRef<HTMLInputElement>(null)
  const taxonRef = useRef<HTMLInputElement>(null)

  const [mintedToken, setMintedToken] = useState<MintedToken>()
  const [sbt, setSbt] = useState(false);
  const [status, setStatus] = useState<'loading' | 'connected' | 'unconnected'>('loading')
  const [royalty, setRoyalty] = useState<typeof ROYALTIES[number]>(0)

  useEffect(() => {
    xumm.on('success', async() => {
        setStatus(await xumm.user.account ? 'connected' : 'unconnected')
    })
    xumm.on('ready',async()=>{
      // get connected user
      const account = await new Promise<string | null>(async (resolve) => {
        setTimeout(() => resolve(null), 1000)
        resolve(await xumm.user.account || null)
      })
      // set connected status
      setStatus(account ? 'connected' : 'unconnected')
    })
  }, [])
  
  const disconnect = useCallback(async () => {
    await xumm.logout()
    setStatus('unconnected')
  }, [])

  const taxon = useMemo(() => parseInt(taxonRef.current?.value || '0'), [])
  const transferFee = useMemo(() => royalty * 1000, [royalty])
  const uri = useMemo(() => Buffer.from(uriRef.current?.value || '', 'utf8').toString('hex').toUpperCase(), [])

  const mint: FormEventHandler<HTMLButtonElement> = useCallback(async (event) => {
    event.preventDefault();
    setMintedToken(undefined)
    if (!formRef.current?.checkValidity()) {
      formRef.current?.reportValidity()
      return
    }
    const payload = {
      TransactionType: "NFTokenMint",
      NFTokenTaxon: taxon,
      ...(sbt ? { Flags: 8, TransferFee: transferFee, } : {}),
      ...(uri ? { URI: uri, }
        : {}),
    } as const;

    const response = await xumm.payload?.create(payload)
    if (!response) return
    const { uuid, next: { always: url } } = response
    // open payload
    const pcWindowId = windowOpen(url);
    // get payload status
    const subscription = await xumm.payload?.subscribe(uuid)
    if (!subscription) return
    subscription.websocket.onmessage = (message) => {
      // subscription websocket message from xumm
      if (message.data.toString().match(/signed/)) {
        // close popup window(pc)
        setTimeout(() => pcWindowId?.close(), 1500)
        const json = JSON.parse(message.data.toString())
        subscription.resolve(json.signed)
      }
    }
    await subscription.resolved

    // get tx to retrieve nftokenId
    const result = await xumm.payload?.get(uuid)
    if (!result?.response.txid) return
    const { txid, dispatched_nodetype, dispatched_to } = result.response
    const client = new XrplClient(dispatched_to!)
    const txResponse = await client.send({
      command: 'tx',
      transaction: txid
    })
    const tokenId = parser(txResponse.meta)
    setMintedToken({
      tokenId,
      network: dispatched_nodetype!
    })
  }, [sbt, taxon, transferFee, uri])

  const openPage = useCallback(() => {
    if (!mintedToken) return
    if (mintedToken.network === 'MAINNET') {
      window.open(`https://xrp.cafe/nft/${mintedToken.tokenId}`, '_blank')
    } else if (mintedToken.network === 'TESTNET') {
      window.open(`https://test.bithomp.com/nft/${mintedToken.tokenId}`, '_blank')
    } else if (mintedToken.network === 'DEVNET') {
      window.open(`https://dev.bithomp.com/nft/${mintedToken.tokenId}`, '_blank')
    } else {
      alert('Unsupported network.')
    }
  }, [mintedToken])

  return (
    <div className='p-4 mt-8 md:mt-24 text-center'>
      <div className='text-4xl my-8 break-all flex items-center flex-col'>
        XRPL NFT Demo
        <div className='flex justify-end text-sm max-w-sm w-full'>
          {status === 'connected' && <button className='btn btn-sm btn-outline' onClick={disconnect}>Logout</button>}
        </div>
      </div>
      <div className='flex justify-center'>
        {status === 'unconnected' &&
          <button className='btn btn-primary' onClick={xumm.authorize}>Connect Wallet</button>
        }
        {status === 'connected' &&
          <div className='flex flex-col gap-1 w-full max-w-xs'>
            <form ref={formRef} className='form-control'>
              {/* URI */}
              <label className='label pb-0'>
                <span className='label-text'>URI</span>
              </label>
              <input ref={uriRef} type="text" className="input input-bordered w-full max-w-xs" />
              {/* Taxon */}
              <label className='label pb-0'>
                <span className='label-text'>Collectio No</span>
              </label>
              <input type="text" inputMode="numeric" min={0} max={4294967295} className="input input-bordered w-full max-w-xs" pattern="^[0-9]+$" title="0〜4294967295の数値で入力してください。" required />
              {/* SBT */}
              <label className="label cursor-pointer mt-2">
                <span>SBT</span>
                <input type="checkbox" checked={sbt} onChange={() => setSbt(!sbt)} className="checkbox" />
              </label>
              {!sbt &&
                // Royalty
                <>
                  <label className='label pb-0'>
                    <span className='label-text'>Royalty</span>
                  </label>
                  <div className="btn-group w-full">
                    {ROYALTIES.map((r) => (
                      <button key={r} type='button' onClick={() => setRoyalty(r)} className={`btn btn-outline border-gray-300 w-1/4 ${royalty === r ? 'btn-active' : ''}`}>{r}%</button>
                    ))}
                  </div>
                </>
              }
              <button type='submit' className='mt-4 btn btn-primary' onClick={mint}>Mint</button>
              {mintedToken &&
                <div className='mt-8'>
                  <button type='button' className='w-full btn btn-outline btn-success' onClick={openPage}>Open NFT Page</button>
                </div>
              }
            </form>
          </div>
        }
      </div>
    </div>
  );
}

export default App;
