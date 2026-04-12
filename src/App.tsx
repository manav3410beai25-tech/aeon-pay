import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import jsQR from 'jsqr';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid 
} from 'recharts';
import { 
  ScanLine, Send, Landmark, SmartphoneNfc, History, Wallet,
  WifiOff, BellRing, Bot, Zap, ChevronRight, CreditCard,
  Briefcase, ArrowLeft, MessageSquare, Camera, X, PlusCircle,
  Building, CheckCircle2, Globe, LogOut, Settings, LogIn
} from 'lucide-react';
import './index.css';

interface Message { role: 'user' | 'ai'; content: string; }
interface Transaction { id: string; target: string; date: string; amount: number; type: 'debit' | 'credit'; }

const STOCK_DATA = [
  { time: '10:00', price: 145 }, { time: '11:00', price: 152 }, { time: '12:00', price: 148 },
  { time: '13:00', price: 165 }, { time: '14:00', price: 160 }, { time: '15:00', price: 175 }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); 
  const [currentScreen, setCurrentScreen] = useState('main'); 
  
  // States
  const [dpUrl, setDpUrl] = useState<string | null>(null);
  const [quote, setQuote] = useState('The future of Gen-Z Finance.');
  const [messages, setMessages] = useState<Message[]>([ { role: 'ai', content: "Hello! I am Sentinel AI. How can I assist with your AeonPay wealth today?" } ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Balances & Transactions
  const [walletBalance, setWalletBalance] = useState(14500.00);
  const [vaultBalance, setVaultBalance] = useState(2500.00);
  const [banks, setBanks] = useState(['State Bank of India - •••• 5678']);
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: '1', target: 'Starbucks Cafe', date: 'Today, 9:24 AM', amount: 450, type: 'debit' },
    { id: '2', target: 'Vignesh (Split)', date: 'Yesterday', amount: 800, type: 'credit' }
  ]);
  
  // Current Transfer Target
  const [transferMode, setTransferMode] = useState<'mobile' | 'bank' | 'self' | 'overseas'>('mobile');
  const [transferInput, setTransferInput] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferCurrency, setTransferCurrency] = useState('USD');
  const [selfFromBank, setSelfFromBank] = useState('');
  const [selfToBank, setSelfToBank] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Vault Refill
  const [refillAmount, setRefillAmount] = useState('');

  // Scanner
  const [qrStatus, setQrStatus] = useState<string>('Searching for QR code...');

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const userQuery = inputText;
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setIsTyping(true);
    try {
      const res = await axios.post('/api/advisor', { message: userQuery });
      if (res.data.reply) setMessages(prev => [...prev, { role: 'ai', content: res.data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: "Error: Could not reach the API endpoint." }]);
    }
    setIsTyping(false);
  };

  const handleDpUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => { if (ev.target?.result) setDpUrl(ev.target.result as string); };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const executePayment = () => {
    if(!transferAmount || isNaN(Number(transferAmount))) return;
    const amt = Number(transferAmount);
    setPaymentSuccess(true);
    
    setTimeout(() => {
      setPaymentSuccess(false);
      setWalletBalance(prev => prev - amt);
      setTransactions(prev => [{
        id: Math.random().toString(),
        target: transferMode === 'mobile' ? transferInput : 
                transferMode === 'bank' ? 'Bank Transfer' : 
                transferMode === 'self' ? 'Self Linked Bank' : 'Overseas Remittance',
        date: 'Just now',
        amount: amt,
        type: 'debit'
      }, ...prev]);
      setTransferAmount('');
      setTransferInput('');
      setCurrentScreen('main');
    }, 2000);
  };

  const executeVaultRefill = () => {
    if(!refillAmount || isNaN(Number(refillAmount))) return;
    const amt = Number(refillAmount);
    setPaymentSuccess(true);
    setTimeout(() => {
      setPaymentSuccess(false);
      setVaultBalance(prev => prev + amt);
      setWalletBalance(prev => prev - amt);
      setRefillAmount('');
      setCurrentScreen('main');
    }, 1500);
  }

const ScannerScreen = ({ onBack, onScan }: { onBack: () => void, onScan: (data: string) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrStatus, setQrStatus] = useState<string>('Searching for QR code...');

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(s => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
          requestAnimationFrame(tick);
        }
      }).catch(() => setQrStatus('Camera access denied.'));

    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        const w = videoRef.current.videoWidth;
        const h = videoRef.current.videoHeight;
        canvasRef.current.width = w;
        canvasRef.current.height = h;
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, w, h);
          const imgData = ctx.getImageData(0, 0, w, h);
          const code = jsQR(imgData.data, imgData.width, imgData.height);
          if (code) {
            setQrStatus(`Detected QR: ${code.data.substring(0,25)}... Redirecting!`);
            setTimeout(() => {
               if(stream) stream.getTracks().forEach(t => t.stop());
               onScan(code.data);
            }, 1000);
            return;
          } else {
            setQrStatus('No QR code detected...');
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div style={{ height: '100%', background: 'var(--black)', position: 'relative' }}>
      <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '2rem', display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
        <div onClick={onBack} style={{ background: 'var(--white)', padding: '12px', borderRadius: '50%', cursor: 'pointer', border: '2px solid var(--black)' }}><X size={24} /></div>
        <div style={{ background: 'var(--yellow)', padding: '12px 24px', borderRadius: '99px', border: '2px solid var(--black)', fontWeight: 800 }}>Scan UPI QR</div>
      </div>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '250px', height: '250px', border: '4px solid var(--yellow)', borderRadius: '24px', boxShadow: '0 0 0 4000px rgba(0,0,0,0.6)' }}></div>
      <div style={{ position: 'absolute', bottom: '15%', left: 0, right: 0, textAlign: 'center', color: 'var(--yellow)', fontWeight: 800, fontSize: '1.25rem', padding: '0 2rem' }}>
         {qrStatus}
      </div>
    </div>
  );
};


const renderProfile = () => (
    <div style={{ padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--light-gray)' }}>
      <header className="app-header" style={{ marginBottom: '2rem', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div onClick={() => setCurrentScreen('main')} style={{ cursor: 'pointer', padding: '8px', border: '2px solid var(--black)', borderRadius: '50%', background: 'var(--white)'}}><ArrowLeft size={20}/></div>
          <div style={{ fontWeight: 900, fontSize: '1.25rem' }}>Profile Setup</div>
        </div>
      </header>
      <div className="b-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: 100, height: 100, borderRadius: '50%', border: '4px solid var(--black)', overflow: 'hidden', background: 'var(--sage)', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          {dpUrl ? <img src={dpUrl} alt="DP" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={32} />}
          <input type="file" accept="image/*" onChange={handleDpUpload} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
        </div>
        <p style={{ fontWeight: 800 }}>Tap to change picture</p>
        <div style={{ width: '100%', marginTop: '1rem' }}>
          <label style={{ fontWeight: 800, fontSize: '0.875rem' }}>Your Quote / Bio</label>
          <input type="text" value={quote} onChange={e => setQuote(e.target.value)} style={{ width: '100%', padding: '12px', border: '2px solid var(--black)', borderRadius: '12px', marginTop: '4px', fontFamily: 'inherit', fontWeight: 600 }} />
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div style={{ padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--charcoal)' }}>
      <header className="app-header" style={{ marginBottom: '1rem', borderRadius: '16px', background: 'var(--yellow)' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div onClick={() => setCurrentScreen('main')} style={{ cursor: 'pointer', padding: '8px', border: '2px solid var(--black)', borderRadius: '50%', background: 'var(--white)'}}><ArrowLeft size={20}/></div>
          <div style={{ fontWeight: 900, fontSize: '1.25rem' }}>Notifications</div>
        </div>
      </header>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
         {[{ title: 'Welcome to AeonPay🤍', desc: 'Secure your first transaction.', time: '1m ago' }, { title: 'Bill Reminder', desc: 'Electricity bill of ₹1,200 due tomorrow.', time: '1h ago' }].map((n, i) => (
           <div key={i} className="b-card" style={{ padding: '1rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontWeight: 800 }}>{n.title}</span><span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--charcoal)', opacity: 0.7 }}>{n.time}</span></div>
             <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{n.desc}</div>
           </div>
         ))}
      </div>
    </div>
  );

  const renderTransfer = () => (
    <div style={{ padding: '1rem', height: '100%', background: 'var(--white)', display: 'flex', flexDirection: 'column' }}>
       <header className="app-header" style={{ marginBottom: '2rem', borderRadius: '16px', background: 'var(--sage)' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div onClick={() => setCurrentScreen('main')} style={{ cursor: 'pointer', padding: '8px', border: '2px solid var(--black)', borderRadius: '50%', background: 'var(--white)'}}><ArrowLeft size={20}/></div>
          <div style={{ fontWeight: 900, fontSize: '1.25rem' }}>Send Money</div>
        </div>
      </header>
      {paymentSuccess ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
           <CheckCircle2 size={80} color="#10b981" />
           <h2 style={{ fontSize: '2rem', fontWeight: 900 }}>Payment Sent!</h2>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {transferMode === 'mobile' && (
            <div>
              <label style={{ fontWeight: 800, fontSize: '0.875rem' }}>To Mobile Number</label>
              <input type="text" placeholder="e.g. 9876543210" value={transferInput} onChange={e => setTransferInput(e.target.value)}
                style={{ width: '100%', padding: '16px', border: '2px solid var(--black)', borderRadius: '12px', marginTop: '8px', fontFamily: 'inherit', fontWeight: 600, fontSize: '1rem' }} />
              {transferInput.length >= 10 && <div style={{ marginTop: '8px', fontSize: '0.875rem', fontWeight: 700, color: 'var(--sage)' }}>Verified UPI ID: {transferInput}@aeon</div>}
            </div>
          )}

          {transferMode === 'bank' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <label style={{ fontWeight: 800, fontSize: '0.875rem' }}>Select Target Bank</label>
              <select style={{ width: '100%', padding: '16px', border: '2px solid var(--black)', borderRadius: '12px', fontFamily: 'inherit', fontWeight: 600 }}>
                 <option>State Bank of India</option><option>HDFC Bank</option><option>ICICI Bank</option>
              </select>
              <input type="text" placeholder="Account Number" style={{ width: '100%', padding: '16px', border: '2px solid var(--black)', borderRadius: '12px', fontFamily: 'inherit', fontWeight: 600 }} />
              <input type="text" placeholder="IFSC Code" style={{ width: '100%', padding: '16px', border: '2px solid var(--black)', borderRadius: '12px', fontFamily: 'inherit', fontWeight: 600 }} />
            </div>
          )}

          {transferMode === 'self' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <label style={{ fontWeight: 800, fontSize: '0.875rem' }}>Self Transfer</label>
              <select value={selfFromBank} onChange={e=>setSelfFromBank(e.target.value)} style={{ width: '100%', padding: '16px', border: '2px solid var(--black)', borderRadius: '12px', fontFamily: 'inherit', fontWeight: 600 }}>
                 <option value="" disabled>From Bank...</option>
                 {banks.map((b, i) => <option key={i}>{b}</option>)}
              </select>
              <select value={selfToBank} onChange={e=>setSelfToBank(e.target.value)} style={{ width: '100%', padding: '16px', border: '2px solid var(--black)', borderRadius: '12px', fontFamily: 'inherit', fontWeight: 600 }}>
                 <option value="" disabled>To Bank...</option>
                 <option>HDFC Bank - •••• 1234</option>
              </select>
            </div>
          )}

          {transferMode === 'overseas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <label style={{ fontWeight: 800, fontSize: '0.875rem' }}>Overseas Remittance (Currency)</label>
              <select value={transferCurrency} onChange={e=>setTransferCurrency(e.target.value)} style={{ width: '100%', padding: '16px', border: '2px solid var(--black)', borderRadius: '12px', fontFamily: 'inherit', fontWeight: 600 }}>
                 <option value="USD">USD - US Dollar</option><option value="EUR">EUR - Euro</option><option value="GBP">GBP - British Pound</option>
              </select>
              <input type="text" placeholder="Recipient IBAN / Swift" style={{ width: '100%', padding: '16px', border: '2px solid var(--black)', borderRadius: '12px', fontFamily: 'inherit', fontWeight: 600 }} />
            </div>
          )}

          <div>
            <label style={{ fontWeight: 800, fontSize: '0.875rem' }}>Amount</label>
            <div style={{ position: 'relative', marginTop: '8px' }}>
              <span style={{ position: 'absolute', left: '16px', top: '14px', fontSize: '1.5rem', fontWeight: 900 }}>{transferMode === 'overseas' ? '$' : '₹'}</span>
              <input type="number" placeholder="0" value={transferAmount} onChange={e => setTransferAmount(e.target.value)}
                style={{ width: '100%', padding: '16px 16px 16px 48px', border: '2px solid var(--black)', borderRadius: '12px', fontFamily: 'inherit', fontWeight: 900, fontSize: '1.5rem' }}/>
            </div>
            {transferMode === 'overseas' && transferAmount && <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--sage)', marginTop: '4px' }}>≈ ₹{(Number(transferAmount)*83.5).toFixed(2)} (Live rate applied)</div>}
          </div>
          
          <button onClick={executePayment} style={{ marginTop: 'auto', marginBottom: '2rem', background: 'var(--charcoal)', color: 'var(--yellow)', border: '2px solid var(--black)', borderRadius: '16px', padding: '1.25rem', fontSize: '1.25rem', fontWeight: 900, cursor: 'pointer', boxShadow: '4px 4px 0px 0px var(--black)' }}>
            PAY NOW
          </button>
        </div>
      )}
    </div>
  );

  const renderWealth = () => (
    <div style={{ padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--black)', color: 'var(--white)' }}>
      <header className="app-header" style={{ marginBottom: '1rem', borderRadius: '16px', background: 'var(--dark-gray)', border: '2px solid var(--white)' }}>
         <div style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--yellow)' }}>Wealth & Predictions</div>
      </header>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
         <div className="b-card charcoal" style={{ border: '2px solid var(--sage)' }}>
            <h3 style={{ marginBottom: '1rem' }}>Sentinel Market Prediction: NIFTY 50</h3>
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer>
                <AreaChart data={STOCK_DATA}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--sage)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--sage)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip />
                  <Area type="monotone" dataKey="price" stroke="var(--sage)" fillOpacity={1} fill="url(#colorPrice)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
         </div>
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="b-card" style={{ background: 'var(--white)', color: 'var(--black)' }}>
               <h4 style={{ fontWeight: 900, fontSize: '1rem' }}>AAPL</h4>
               <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981' }}>+2.4%</div>
            </div>
            <div className="b-card" style={{ background: 'var(--white)', color: 'var(--black)' }}>
               <h4 style={{ fontWeight: 900, fontSize: '1rem' }}>BTC</h4>
               <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--charcoal)' }}>-1.1%</div>
            </div>
         </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div style={{ padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--light-gray)' }}>
      <header className="app-header" style={{ marginBottom: '1rem', borderRadius: '16px', background: 'var(--yellow)' }}>
         <div style={{ fontWeight: 900, fontSize: '1.25rem' }}>Transaction History</div>
      </header>
      <div style={{ flex: 1, overflowY: 'auto' }}>
         <div className="tx-list">
            {transactions.map((t) => (
              <div key={t.id} className="tx-item">
                <div className="tx-left">
                  <div className="tx-avatar" style={{ background: t.type === 'credit' ? 'var(--yellow)' : 'var(--sage)' }}>
                    {t.target.substring(0,2).toUpperCase()}
                  </div>
                  <div className="tx-details">
                    <span className="tx-name">{t.target}</span>
                    <span className="tx-date">{t.date}</span>
                  </div>
                </div>
                <div className={`tx-amount ${t.type === 'credit' ? 'positive' : ''}`}>
                  {t.type === 'credit' ? '+' : '-'}₹{t.amount.toFixed(2)}
                </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );

  const renderWallet = () => (
    <div style={{ padding: '1rem', height: '100%', background: 'var(--charcoal)', display: 'flex', flexDirection: 'column', color: 'var(--white)' }}>
       <header className="app-header" style={{ marginBottom: '1rem', borderRadius: '16px', background: 'var(--light-gray)' }}>
         <div style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--black)' }}>AeonPay Wallet Options</div>
      </header>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div className="b-card yellow" style={{ marginBottom: '1.5rem', color: 'var(--black)' }}>
           <h3 style={{ fontSize: '1rem', opacity: 0.8 }}>Wallet Balance</h3>
           <div style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '8px' }}>₹{walletBalance.toFixed(2)}</div>
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '1rem' }}>Linked Accounts</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
           {banks.map((b, i) => (
             <div key={i} className="b-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--white)', color: 'var(--black)' }}>
               <div style={{ background: 'var(--sage)', padding: '12px', borderRadius: '12px', border: '2px solid var(--black)'}}><Building size={24} /></div>
               <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{b}</div>
               <div style={{ marginLeft: 'auto' }}><CheckCircle2 size={24} color="#10b981" /></div>
             </div>
           ))}
           <div className="b-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', borderStyle: 'dashed', cursor: 'pointer', background: 'transparent', color: 'var(--white)', borderColor: 'var(--sage)' }}>
              <PlusCircle size={24} /> <span style={{ fontWeight: 800 }}>Connect Bank Account</span>
           </div>
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '1rem' }}>Settings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           <div className="b-card" style={{ background: 'var(--dark-gray)', border: 'none', display: 'flex', gap: '12px', fontWeight: 800 }}><Settings size={20}/> Account Settings</div>
           <div className="b-card" style={{ background: 'var(--dark-gray)', border: 'none', display: 'flex', gap: '12px', fontWeight: 800, color: 'var(--yellow)' }}><LogOut size={20}/> Logout securely</div>
        </div>
      </div>
    </div>
  );

  const renderHome = () => (
    <>
      <header className="app-header">
        <div className="profile-badge" onClick={() => setCurrentScreen('profile')} style={{ cursor: 'pointer', overflow: 'hidden' }}>
          {dpUrl ? <img src={dpUrl} alt="DP" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'M'}
        </div>
        <div className="brand-title"><Zap size={20} fill="black" /> AeonPay🤍</div>
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setCurrentScreen('notifications')}>
          <BellRing size={24} />
          <div style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, backgroundColor: 'var(--sage)', border: '2px solid var(--black)', borderRadius: '50%'}}></div>
        </div>
      </header>
      <main className="app-content">
        <div style={{ textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, opacity: 0.8, marginTop: '-0.5rem', marginBottom: '0.5rem' }}>"{quote}"</div>
        <div className="qr-scanner" onClick={() => setCurrentScreen('scanner')} style={{ cursor: 'pointer' }}>
          <div><h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Scan any QR Code</h2><p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Pay at stores instantly.</p></div>
          <div className="qr-scanner-btn"><ScanLine size={24} /></div>
        </div>
        <div className="b-card">
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Money Transfers</h3>
          <div className="action-grid">
            <div className="action-item" onClick={() => {setTransferMode('mobile'); setCurrentScreen('transfer');}}><div className="action-icon"><Send size={24} strokeWidth={2.5} /></div><span className="action-label">To Mobile</span></div>
            <div className="action-item" onClick={() => {setTransferMode('bank'); setCurrentScreen('transfer');}}><div className="action-icon"><Landmark size={24} strokeWidth={2.5} /></div><span className="action-label">To Bank</span></div>
            <div className="action-item" onClick={() => {setTransferMode('self'); setCurrentScreen('transfer');}}><div className="action-icon"><CreditCard size={24} strokeWidth={2.5} /></div><span className="action-label">Self</span></div>
            <div className="action-item" onClick={() => {setTransferMode('overseas'); setCurrentScreen('transfer');}}><div className="action-icon"><Globe size={24} strokeWidth={2.5} /></div><span className="action-label">Overseas</span></div>
          </div>
        </div>
        <div className="b-card charcoal">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div><div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><WifiOff size={16} color="var(--yellow)" /><span className="pill">Resilient Edge</span></div><h3 style={{ fontSize: '1rem' }}>Tap-to-Pay Vault</h3></div>
            <SmartphoneNfc size={28} color="var(--sage)" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div><div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Available Offline Limit</div><div style={{ fontSize: '1.75rem', fontWeight: 900 }}>₹{vaultBalance.toFixed(2)}</div></div>
            <div onClick={() => setCurrentScreen('vault_refill')} style={{ border: '2px solid var(--yellow)', padding: '6px 12px', borderRadius: '8px', color: 'var(--yellow)', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>REFILL</div>
          </div>
        </div>
      </main>
    </>
  );

  return (
    <div className="app-container">
      {activeTab === 'chat' ? renderHome() :
       activeTab === 'wealth' ? renderWealth() :
       activeTab === 'history' ? renderHistory() :
       activeTab === 'wallet' && currentScreen === 'main' ? renderWallet() :
        currentScreen === 'profile' ? renderProfile() :
        currentScreen === 'notifications' ? renderNotifications() :
        currentScreen === 'scanner' ? <ScannerScreen onBack={() => setCurrentScreen('main')} onScan={(data) => {
           setTransferMode('mobile');
           setTransferInput(data);
           setCurrentScreen('transfer');
        }} /> :
        currentScreen === 'transfer' ? renderTransfer() :
        currentScreen === 'vault_refill' ? (
           <div style={{ padding: '1rem', height: '100%', background: 'var(--white)', display: 'flex', flexDirection: 'column' }}>
             <header className="app-header" style={{ marginBottom: '2rem', borderRadius: '16px', background: 'var(--yellow)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div onClick={() => setCurrentScreen('main')} style={{ cursor: 'pointer', padding: '8px', border: '2px solid var(--black)', borderRadius: '50%', background: 'var(--white)'}}><ArrowLeft size={20}/></div>
                <div style={{ fontWeight: 900, fontSize: '1.25rem' }}>Refill Offline Vault</div>
              </div>
            </header>
            {paymentSuccess ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                 <CheckCircle2 size={80} color="#10b981" />
                 <h2 style={{ fontSize: '2rem', fontWeight: 900 }}>Vault Loaded!</h2>
              </div>
            ) : (
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ fontWeight: 800, fontSize: '0.875rem' }}>Bank Source</label>
                <select style={{ width: '100%', padding: '16px', border: '2px solid var(--black)', borderRadius: '12px', marginTop: '8px', fontFamily: 'inherit', fontWeight: 600 }}>
                   {banks.map((b, i) => <option key={i}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontWeight: 800, fontSize: '0.875rem' }}>Amount</label>
                <div style={{ position: 'relative', marginTop: '8px' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '14px', fontSize: '1.5rem', fontWeight: 900 }}>₹</span>
                   <input type="number" placeholder="0" value={refillAmount} onChange={e => setRefillAmount(e.target.value)}
                    style={{ width: '100%', padding: '16px 16px 16px 48px', border: '2px solid var(--black)', borderRadius: '12px', fontFamily: 'inherit', fontWeight: 900, fontSize: '1.5rem' }}/>
                </div>
              </div>
              <button onClick={executeVaultRefill} style={{ marginTop: 'auto', marginBottom: '2rem', background: 'var(--charcoal)', color: 'var(--yellow)', border: '2px solid var(--black)', borderRadius: '16px', padding: '1.25rem', fontSize: '1.25rem', fontWeight: 900, cursor: 'pointer', boxShadow: '4px 4px 0px 0px var(--black)' }}>
                LOAD SECURELY
              </button>
             </div>
            )}
           </div>
        ) : renderHome()}

      {activeTab === 'chat' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'var(--charcoal)', display: 'flex', flexDirection: 'column' }}>
           <header className="app-header" style={{ alignItems: 'flex-end', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <div onClick={() => setActiveTab('home')} style={{ cursor: 'pointer', backgroundColor: 'var(--white)', border: '2px solid var(--black)', padding: '8px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                 <ArrowLeft size={20} />
               </div>
               <div>
                 <div style={{ fontWeight: 900, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Bot size={20} /> Sentinel AI</div>
               </div>
            </div>
          </header>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {messages.map((msg, idx) => (
               <div key={idx} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', backgroundColor: msg.role === 'user' ? 'var(--sage)' : 'var(--white)', color: 'var(--black)', padding: '12px 16px', borderRadius: '16px', border: '2px solid var(--black)', boxShadow: '2px 2px 0px 0px var(--black)', fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.4 }}>
                 {msg.content}
               </div>
             ))}
             {isTyping && <div style={{ alignSelf: 'flex-start', backgroundColor: 'var(--white)', padding: '12px 16px', borderRadius: '16px', border: '2px solid var(--black)', fontWeight: 800, fontSize: '0.875rem' }}>Typing...</div>}
             <div ref={messagesEndRef} />
          </div>
          <div style={{ display: 'flex', gap: '8px', padding: '1rem', background: 'var(--charcoal)' }}>
             <input type="text" placeholder="Message Sentinel..." value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '2px solid var(--black)', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.875rem' }} />
             <button onClick={handleSendMessage} style={{ backgroundColor: 'var(--yellow)', border: '2px solid var(--black)', borderRadius: '12px', width: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: '2px 2px 0px 0px var(--black)' }}><Send size={20} /></button>
          </div>
        </div>
      )}

      {currentScreen === 'main' && activeTab !== 'chat' && (
        <nav className="bottom-nav">
          <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
            <Zap size={24} /><span>Home</span>
          </div>
          <div className={`nav-item ${activeTab === 'wallet' ? 'active' : ''}`} onClick={() => {setActiveTab('wallet'); setCurrentScreen('main');}}>
            <Wallet size={24} /><span>Wallet</span>
          </div>
          <div className={`nav-item`} style={{ transform: 'translateY(-15px)', cursor: 'pointer' }} onClick={() => setCurrentScreen('scanner')}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--black)', border: '2px solid var(--charcoal)', display: 'flex', justifyContent: 'center', alignItems: 'center', outline: '4px solid var(--white)' }}>
              <ScanLine size={28} color="var(--yellow)" />
            </div>
          </div>
          <div className={`nav-item ${activeTab === 'wealth' ? 'active' : ''}`} onClick={() => setActiveTab('wealth')}>
            <Briefcase size={24} /><span>Wealth</span>
          </div>
          <div className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
            <Bot size={24} /><span>Chat AI</span>
          </div>
        </nav>
      )}
    </div>
  );
}
