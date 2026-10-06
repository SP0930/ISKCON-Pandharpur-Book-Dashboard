import './app.css';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  BookOpen, ChartNoAxesCombined, ChevronRight, ClipboardList, Coins,
  Home, Menu, Moon, Plus, Printer, Search, ShoppingCart, Sparkles,
  Sun, SunMedium, Wallet, X,
} from 'lucide-react';

type Book = { id: number; n: string; l: string; m: number; p: number; s: number; min: number };
type DiscountMode = 'amount' | 'percentage';
type Bill = {
  no: number; c: string; d: string; tm: string; pay: 'Cash' | 'Online';
  it: [number, number][]; st: string; discount: number;
  discountMode: DiscountMode; discountInput: number;
};
type Screen = 'home' | 'books' | 'sale' | 'receipt' | 'reports' | 'stock' | 'more';
type Report = 'Summary' | 'Book-wise' | 'Language-wise' | 'Payment-wise';

const initialBooks: Book[] = [
  { id: 1, n: 'Gita As It Is', l: 'मराठी', m: 300, p: 250, s: 85, min: 20 },
  { id: 2, n: 'Gita As It Is', l: 'हिंदी', m: 300, p: 250, s: 0, min: 20 },
  { id: 3, n: 'Gita As It Is', l: 'English', m: 300, p: 250, s: 40, min: 20 },
  { id: 4, n: 'Gita Saar (छोटी)', l: 'मराठी', m: 60, p: 50, s: 5, min: 30 },
  { id: 5, n: 'Easy Journey to Other Planets', l: 'English', m: 80, p: 70, s: 8, min: 15 },
  { id: 6, n: 'Gita As It Is', l: 'ગુજરાતી', m: 300, p: 250, s: 25, min: 10 },
];
const initialBills: Bill[] = [
  { no: 1039, c: 'प्रिया जोशी', d: '2026-10-03', tm: '09:30', pay: 'Cash', it: [[1, 4], [4, 1]], st: 'गोविंद', discount: 0, discountMode: 'amount', discountInput: 0 },
  { no: 1040, c: 'अमित शर्मा', d: '2026-10-03', tm: '09:48', pay: 'Online', it: [[2, 1], [3, 1]], st: 'गोविंद', discount: 0, discountMode: 'amount', discountInput: 0 },
  { no: 1041, c: 'सुनिता देशमुख', d: '2026-10-02', tm: '10:05', pay: 'Cash', it: [[4, 5]], st: 'राधा दासी', discount: 0, discountMode: 'amount', discountInput: 0 },
  { no: 1042, c: 'रामेश्वर पाटील', d: '2026-10-01', tm: '10:21', pay: 'Online', it: [[1, 2], [5, 2]], st: 'राधा दासी', discount: 0, discountMode: 'amount', discountInput: 0 },
];
const navItems: { key: Screen; label: string; icon: typeof Home }[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'books', label: 'पुस्तके', icon: BookOpen },
  { key: 'sale', label: 'विक्री', icon: ShoppingCart },
  { key: 'reports', label: 'Reports', icon: ChartNoAxesCombined },
  { key: 'more', label: 'अधिक', icon: Menu },
];
const format = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
const subtotal = (bill: Bill, books: Book[]) => bill.it.reduce((sum, [id, q]) => sum + (books.find(b => b.id === id)?.p || 0) * q, 0);
const total = (bill: Bill, books: Book[]) => Math.max(0, subtotal(bill, books) - bill.discount);
const mrp = (bill: Bill, books: Book[]) => bill.it.reduce((sum, [id, q]) => sum + (books.find(b => b.id === id)?.m || 0) * q, 0);
const quantity = (bill: Bill) => bill.it.reduce((sum, [, q]) => sum + q, 0);

function Metric({ label, value, tone = '' }: { label: string; value: string | number; tone?: string }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const match = String(value).match(/^(₹?)([\d,]+)(.*)$/);
    if (!match || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(value); return; }
    const prefix = match[1]; const suffix = match[3]; const target = Number(match[2].replaceAll(',', ''));
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 650);
      const n = Math.round(target * (1 - Math.pow(1 - t, 3)));
      setShown(`${prefix}${n.toLocaleString('en-IN')}${suffix}`);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <div className={`metric ${tone}`}><small>{label}</small><b>{shown}</b></div>;
}

function LotusMark({ className = '', width = '68', height = '46' }: { className?: string; width?: string; height?: string }) {
  return <svg className={className} width={width} height={height} viewBox="0 0 100 52" aria-hidden="true">
    <g fill="#f9c4d4" stroke="#e58aa6" strokeWidth="1.5">
      <ellipse cx="50" cy="28" rx="10" ry="22" transform="rotate(-68 50 48)" />
      <ellipse cx="50" cy="28" rx="10" ry="22" transform="rotate(68 50 48)" />
      <ellipse cx="50" cy="28" rx="10" ry="22" transform="rotate(-36 50 48)" />
      <ellipse cx="50" cy="28" rx="10" ry="22" transform="rotate(36 50 48)" />
      <ellipse cx="50" cy="26" rx="10" ry="23" fill="#fbd6e0" />
    </g>
  </svg>;
}

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [books, setBooks] = useState(initialBooks);
  const [bills, setBills] = useState(initialBills);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [payment, setPayment] = useState<'Online' | 'Cash'>('Online');
  const [discountMode, setDiscountMode] = useState<DiscountMode>('amount');
  const [discountInput, setDiscountInput] = useState('');
  const [customer, setCustomer] = useState('');
  const [mobile, setMobile] = useState('');
  const [last, setLast] = useState<Bill | null>(null);
  const [language, setLanguage] = useState('सर्व');
  const [bookSearch, setBookSearch] = useState('');
  const [saleSearch, setSaleSearch] = useState('');
  const [report, setReport] = useState<Report>('Summary');
  const [from, setFrom] = useState('2026-10-01');
  const [to, setTo] = useState('2026-10-03');
  const [dark, setDark] = useState(document.documentElement.dataset.theme === 'dark');
  const [toast, setToast] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; }, [dark]);
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 1900);
    return () => window.clearTimeout(timeout);
  }, [toast]);
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(
      '.content .section-title, .content .metric-grid, .content .actions-grid, .content .panel, .content .two-col > section',
    ));
    elements.forEach((element, index) => {
      element.classList.add('scroll-reveal');
      element.style.setProperty('--reveal-delay', `${Math.min(index % 5, 4) * 45}ms`);
    });
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        !('IntersectionObserver' in window)) {
      elements.forEach(element => element.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
    elements.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [screen]);
  const go = (next: Screen) => {
    setScreen(next); setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  const notify = (message: string) => setToast(message);
  const openReceipt = (bill: Bill) => { setLast(bill); go('receipt'); };

  const addToCart = (id: number) => {
    const book = books.find(b => b.id === id);
    if (!book?.s) { notify('हा Stock संपला आहे'); return; }
    setCart(current => ({ ...current, [id]: Math.min((current[id] || 0) + 1, book.s) }));
  };
  const changeQuantity = (id: number, delta: number) => {
    const book = books.find(b => b.id === id);
    setCart(current => {
      const next = { ...current }; const value = (next[id] || 0) + delta;
      if (value <= 0) delete next[id];
      else if (book && value > book.s) { next[id] = book.s; notify('एवढाच Stock आहे'); }
      else next[id] = value;
      return next;
    });
  };
  const makeBill = () => {
    const items = Object.entries(cart).filter(([, q]) => q > 0).map(([id, q]) => [Number(id), q] as [number, number]);
    if (!items.length) { notify('आधी पुस्तक निवडा'); return; }
    if (!customer.trim()) { notify('Customer चं नाव लिहा'); return; }
    const bill: Bill = {
      no: 1043 + bills.length - 4, c: customer.trim(), d: '2026-10-03',
      tm: new Date().toTimeString().slice(0, 5), pay: payment, it: items, st: 'प्रभुजी',
      discount: discountAmount, discountMode, discountInput: enteredDiscount,
    };
    setBooks(current => current.map(book => {
      const line = items.find(([id]) => id === book.id);
      return line ? { ...book, s: book.s - line[1] } : book;
    }));
    setBills(current => [...current, bill]);
    setLast(bill); setCart({}); setCustomer(''); setMobile('');
    setDiscountInput(''); setDiscountMode('amount'); go('receipt');
  };
  const addBook = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim(); const lang = String(data.get('language') || '').trim();
    const startingStock = Number(data.get('stock')) || 0; const listed = Number(data.get('mrp')); const actual = Number(data.get('actual'));
    if (!name || !lang || !listed || !actual) { notify('नाव, भाषा, MRP आणि Actual किंमत भरा'); return; }
    setBooks(current => [...current, { id: Math.max(...current.map(b => b.id)) + 1, n: name, l: lang, m: listed, p: actual, s: startingStock, min: 10 }]);
    event.currentTarget.reset(); notify('पुस्तक जोडलं');
  };
  const filteredBills = useMemo(() => bills.filter(bill => bill.d >= from && bill.d <= to), [bills, from, to]);
  const reportLines = useMemo(() => {
    if (report === 'Summary') return [];
    const groups = new Map<string, { q: number; revenue: number }>();
    filteredBills.forEach(bill => {
      const billSubtotal = subtotal(bill, books);
      bill.it.forEach(([id, q]) => {
        const book = books.find(b => b.id === id); if (!book) return;
        const label = report === 'Book-wise' ? `${book.n} (${book.l})` : report === 'Language-wise' ? book.l : bill.pay;
        const item = groups.get(label) || { q: 0, revenue: 0 };
        const lineSubtotal = q * book.p;
        item.q += q;
        item.revenue += lineSubtotal - (billSubtotal ? bill.discount * lineSubtotal / billSubtotal : 0);
        groups.set(label, item);
      });
    });
    return [...groups.entries()].sort((a, b) => b[1].revenue - a[1].revenue);
  }, [books, filteredBills, report]);
  const matchesBookSearch = (book: Book, query: string) =>
    `${book.n} ${book.l}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
  const filteredBooks = books.filter(book =>
    (language === 'सर्व' || book.l === language) && matchesBookSearch(book, bookSearch));
  const saleBooks = books.filter(book => matchesBookSearch(book, saleSearch));
  const lowBooks = books.filter(book => book.s <= book.min);
  const todayBills = bills.filter(bill => bill.d === '2026-10-03');
  const cartIds = Object.keys(cart).map(Number);
  const cartMrp = cartIds.reduce((sum, id) => sum + (books.find(b => b.id === id)?.m || 0) * cart[id], 0);
  const cartTotal = cartIds.reduce((sum, id) => sum + (books.find(b => b.id === id)?.p || 0) * cart[id], 0);
  const enteredDiscount = Math.max(0, Number(discountInput) || 0);
  const discountAmount = Math.min(
    cartTotal,
    discountMode === 'percentage'
      ? Math.round(cartTotal * Math.min(enteredDiscount, 100) / 100)
      : Math.round(enteredDiscount),
  );
  const amountDue = Math.max(0, cartTotal - discountAmount);
  const reportRevenue = filteredBills.reduce((sum, bill) => sum + total(bill, books), 0);
  const reportDiscount = filteredBills.reduce((sum, bill) => sum + bill.discount, 0);
  const reportQuantity = filteredBills.reduce((sum, bill) => sum + quantity(bill), 0);
  const reportLabel = report === 'Book-wise' ? 'पुस्तक' : report === 'Language-wise' ? 'भाषा' : 'Payment';

  const title: Record<Screen, string> = { home: 'Home', books: 'पुस्तके', sale: 'नवीन विक्री', receipt: 'Receipt', reports: 'Reports', stock: 'Stock Status', more: 'अधिक' };
  const navKey: Screen = screen === 'stock' ? 'more' : screen === 'receipt' ? 'sale' : screen;
  const bookById = (id: number) => books.find(book => book.id === id);
  const badge = (text: string, tone: string) => <span className={`badge ${tone}`}>{text}</span>;
  const stockBadge = (book: Book) => book.s === 0 ? badge('संपली', 'rd') : book.s <= book.min ? badge('कमी', 'am') : badge('ठीक', 'gr');
  const PageHead = ({ heading, sub }: { heading: string; sub?: string }) => <div className="page-head"><div><h1>{heading}</h1>{sub && <p>{sub}</p>}</div></div>;
  const PanelRow = ({ children, right, onClick, tap = false }: { children: ReactNode; right?: ReactNode; onClick?: () => void; tap?: boolean }) =>
    <div className={`row ${tap ? 'tap' : ''}`} onClick={onClick}>{children}{right && <div className="row-right">{right}</div>}</div>;

  const hero = <><section className="hero">
    <div className="hero-date">शनिवार, 03 ऑक्टोबर 2026</div><div className="eyebrow">ISKCON पंढरपूर</div>
    <h1>हरे कृष्ण, प्रभुजी</h1><p>श्रीमद्भगवद्गीता पुस्तक केंद्र</p>
    <div className="hero-orbit" /><LotusMark className="hero-lotus" />
  </section><div className="marquee"><span>{'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे · हरे राम हरे राम राम राम हरे हरे · जय श्रीकृष्ण · जय हरी विठ्ठल · '.repeat(6)}</span></div></>;

  const page = () => {
    if (screen === 'home') return <>
      {hero}
      <h2 className="section-title">आजचा सारांश</h2>
      <div className="metric-grid stagger">
        <Metric label="आजची विक्री" value={format(todayBills.reduce((s, b) => s + total(b, books), 0))} tone="gr" />
        <Metric label="विकलेली पुस्तके" value={todayBills.reduce((s, b) => s + quantity(b), 0)} tone="bl" />
        <Metric label="Online" value={format(todayBills.filter(b => b.pay === 'Online').reduce((s, b) => s + total(b, books), 0))} />
        <Metric label="Offline (Cash)" value={format(todayBills.filter(b => b.pay === 'Cash').reduce((s, b) => s + total(b, books), 0))} />
        <Metric label="Bills" value={todayBills.length} />
        <Metric label="दिलेला Discount" value={format(todayBills.reduce((s, b) => s + b.discount, 0))} />
      </div>
      <h2 className="section-title">Quick Actions</h2>
      <div className="actions-grid">
        <button className="btn" onClick={() => go('sale')}><Plus size={17} /> नवीन विक्री</button>
        <button className="btn outline" onClick={() => go('stock')}>Stock Status ({lowBooks.length} कमी)</button>
        <button className="btn outline" onClick={() => go('reports')}>Reports</button>
      </div>
      <h2 className="section-title">अलीकडील व्यवहार</h2>
      <div className="panel stagger">{[...bills].sort((a, b) => b.no - a.no).slice(0, 5).map(bill =>
        <PanelRow key={bill.no} tap onClick={() => openReceipt(bill)} right={<><b>{format(total(bill, books))}</b><br />{badge(bill.pay, bill.pay === 'Online' ? 'bl' : 'gr')}</>}>
          <span>Bill #{bill.no} · {bill.c}<small>{bill.tm} · {quantity(bill)} पुस्तके</small></span>
        </PanelRow>)}</div>
    </>;

    if (screen === 'books') return <>
      <PageHead heading="पुस्तके" sub="पुस्तकांचा साठा, भाषा आणि किंमत व्यवस्थापन" />
      <div className="search-field">
        <Search size={18} aria-hidden="true" />
        <input aria-label="पुस्तक शोधा" value={bookSearch} onChange={e => setBookSearch(e.target.value)} placeholder="पुस्तकाचे नाव किंवा भाषा शोधा..." />
        {bookSearch && <button type="button" aria-label="शोध पुसून टाका" onClick={() => setBookSearch('')}><X size={16} /></button>}
      </div>
      <div className="chips">{['सर्व', ...new Set(books.map(book => book.l))].map(lang => <button key={lang} className={`chip ${language === lang ? 'on' : ''}`} onClick={() => setLanguage(lang)}>{lang}</button>)}</div>
      <div className="panel stagger">{filteredBooks.map(book => <PanelRow key={book.id} right={<><b>{book.s}</b><br />{stockBadge(book)}</>}>
        <span>{book.n}<small>{book.l} · MRP {format(book.m)} · Actual {format(book.p)}</small></span>
      </PanelRow>)}{!filteredBooks.length && <div className="empty">या शोधात पुस्तक सापडले नाही.</div>}</div>
      <h2 className="section-title">नवीन पुस्तक जोडा</h2>
      <form className="panel" style={{ padding: 20 }} onSubmit={addBook}>
        <div className="input-grid">
          <div style={{ gridColumn: '1/-1' }}><label>पुस्तकाचे नाव</label><input name="name" required /></div>
          <div><label>भाषा</label><input name="language" placeholder="मराठी" required /></div>
          <div><label>सुरुवातीचा Stock</label><input name="stock" type="number" min="0" defaultValue="0" /></div>
          <div><label>MRP ₹</label><input name="mrp" type="number" min="0" required /></div>
          <div><label>Actual किंमत ₹</label><input name="actual" type="number" min="0" required /></div>
        </div>
        <button className="btn full" style={{ marginTop: 16 }} type="submit">पुस्तक Save करा</button>
      </form>
    </>;

    if (screen === 'sale') return <>
      <PageHead heading="नवीन विक्री" sub="पुस्तके निवडा आणि बिल तयार करा" />
      <div className="two-col">
        <section>
          <h2 className="section-title" style={{ marginTop: 0 }}>पुस्तक निवडा</h2>
          <div className="search-field sale-search">
            <Search size={18} aria-hidden="true" />
            <input aria-label="विक्रीसाठी पुस्तक शोधा" value={saleSearch} onChange={e => setSaleSearch(e.target.value)} placeholder="पुस्तक शोधा..." />
            {saleSearch && <button type="button" aria-label="शोध पुसून टाका" onClick={() => setSaleSearch('')}><X size={16} /></button>}
          </div>
          <div className="panel stagger">{saleBooks.map(book => <PanelRow key={book.id} tap onClick={() => addToCart(book.id)} right={<><b>{format(book.p)}</b><small>Actual किंमत</small></>}>
            <span>{book.n}<small>{book.l} · Stock {book.s}</small></span>
          </PanelRow>)}{!saleBooks.length && <div className="empty">या शोधात पुस्तक सापडले नाही.</div>}</div>
          <h2 className="section-title">निवडलेली पुस्तके</h2>
          <div className="panel">{cartIds.length ? cartIds.map(id => {
            const book = bookById(id); if (!book) return null;
            return <PanelRow key={id} right={<div className="quantity"><button aria-label="कमी करा" onClick={() => changeQuantity(id, -1)}>−</button>{cart[id]}<button aria-label="वाढवा" onClick={() => changeQuantity(id, 1)}>+</button></div>}>
              <span>{book.n} ({book.l})<small>Actual {format(book.p)}</small></span>
            </PanelRow>;
          }) : <div className="empty">वरून पुस्तक निवडा.</div>}</div>
        </section>
        <section>
          <h2 className="section-title" style={{ marginTop: 0 }}>Customer Details</h2>
          <div className="input-grid">
            <div><label>नाव</label><input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="रामेश्वर पाटील" /></div>
            <div><label>मोबाईल नंबर</label><input value={mobile} onChange={e => setMobile(e.target.value)} inputMode="numeric" placeholder="98XXXXXX10" /></div>
          </div>
          <h2 className="section-title">Payment</h2>
          <div className="actions-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <button className={`btn ${payment !== 'Online' ? 'outline' : ''}`} onClick={() => setPayment('Online')}><Wallet size={16} />Online (UPI)</button>
            <button className={`btn ${payment !== 'Cash' ? 'outline' : ''}`} onClick={() => setPayment('Cash')}><Coins size={16} />Offline (Cash)</button>
          </div>
          <div className="discount-editor">
            <div className="discount-heading"><span>Discount</span><small>Owner set</small></div>
            <div className="discount-options">
              <div className="discount-switch" role="group" aria-label="Discount चा प्रकार">
                <button className={discountMode === 'amount' ? 'active' : ''} onClick={() => setDiscountMode('amount')}>₹ रक्कम</button>
                <button className={discountMode === 'percentage' ? 'active' : ''} onClick={() => setDiscountMode('percentage')}>% टक्केवारी</button>
              </div>
              <label className="discount-input">
                <span>{discountMode === 'amount' ? '₹' : '%'}</span>
                <input
                  aria-label={discountMode === 'amount' ? 'Discount रक्कम' : 'Discount टक्केवारी'}
                  type="number"
                  min="0"
                  max={discountMode === 'percentage' ? 100 : cartTotal}
                  step={discountMode === 'amount' ? 1 : 0.01}
                  value={discountInput}
                  onChange={e => setDiscountInput(e.target.value)}
                  placeholder="0"
                />
              </label>
            </div>
          </div>
          <div className="summary-box" style={{ marginTop: 18 }}>
            <div><span>MRP एकूण</span><span>{format(cartMrp)}</span></div>
            <div><span>Actual एकूण</span><span>{format(cartTotal)}</span></div>
            <div className="manual-discount"><span>Discount</span><span>− {format(discountAmount)}</span></div>
            <div className="total"><span>भरायची रक्कम</span><span>{format(amountDue)}</span></div>
          </div>
          <button className="btn full" style={{ marginTop: 13 }} onClick={makeBill}>Bill बनवा</button>
        </section>
      </div>
    </>;

    if (screen === 'receipt') {
      if (!last) return <><PageHead heading="Receipt" /><div className="panel empty">अलीकडील व्यवहारातून बिल निवडा.</div><button className="btn" style={{ marginTop: 16 }} onClick={() => go('home')}>Home</button></>;
      return <>
        <PageHead heading="Receipt" sub="पुस्तक विक्री केंद्राची पावती" />
        <article className="receipt printable-receipt">
          <div className="receipt-head"><LotusMark /><h2>ISKCON पंढरपूर · पुस्तक विक्री केंद्र</h2><span className="mute">हरे कृष्ण · धन्यवाद</span></div><hr />
          <PanelRow right={<span className="mute">{last.d} · {last.tm}</span>}><span>Bill #{last.no}</span></PanelRow>
          <div style={{ padding: '12px 0' }}>ग्राहक: <b>{last.c}</b></div>
          {last.it.map(([id, q]) => { const book = bookById(id); return book && <PanelRow key={id} right={format(book.p * q)}><span>{book.n} ({book.l}) × {q}</span></PanelRow>; })}
          <hr />
          <div className="summary-box" style={{ border: 0, padding: 0 }}>
            <div><span>MRP एकूण</span><span>{format(mrp(last, books))}</span></div>
            <div><span>Actual एकूण</span><span>{format(subtotal(last, books))}</span></div>
            <div className="manual-discount">
              <span>Discount {last.discountMode === 'percentage' ? `(${last.discountInput}%)` : '(Owner set)'}</span>
              <span>− {format(last.discount)}</span>
            </div>
            <div className="total"><span>एकूण रक्कम</span><span>{format(total(last, books))}</span></div>
            <div><span className="mute">Payment</span><span>{last.pay}</span></div>
          </div>
        </article>
        <div className="actions-grid" style={{ maxWidth: 680, margin: '16px auto' }}>
          <button className="btn green" onClick={() => notify('WhatsApp वर पाठवलं (demo)')}>WhatsApp</button>
          <button className="btn outline" onClick={() => window.print()}><Printer size={16} />Print / PDF</button>
          <button className="btn" onClick={() => go('sale')}><Plus size={16} />नवीन विक्री</button>
        </div>
      </>;
    }

    if (screen === 'stock') {
      const low = books.filter(book => book.s <= book.min && book.s > 0).length;
      const out = books.filter(book => !book.s).length;
      return <>
        <PageHead heading="Stock Status" sub="पुस्तक साठा आणि कमी साठ्याची सूचना" />
        <div className="metric-grid stagger">
          <Metric label="एकूण Stock" value={books.reduce((s, b) => s + b.s, 0)} />
          <Metric label="Stock Value" value={format(books.reduce((s, b) => s + b.s * b.p, 0))} />
          <Metric label="Low Stock" value={`${low} पुस्तके`} tone="am" />
          <Metric label="Out of Stock" value={`${out} पुस्तके`} tone="rd" />
        </div>
        <h2 className="section-title">Low Stock Alert</h2>
        <div className="panel">{books.filter(book => book.s <= book.min).sort((a, b) => a.s - b.s).map(book =>
          <PanelRow key={book.id} right={badge(book.s ? `${book.s} उरली` : '0 उरली', book.s ? 'am' : 'rd')}>
            <span>{book.n}<small>{book.l} · Min {book.min}</small></span>
          </PanelRow>)}
          {!books.some(book => book.s <= book.min) && <div className="empty">सर्व Stock ठीक आहे.</div>}
        </div>
      </>;
    }

    if (screen === 'reports') return <>
      <PageHead heading="Reports" sub="तारीख आणि विक्रीच्या प्रकारानुसार अहवाल" />
      <div className="input-grid" style={{ maxWidth: 560 }}>
        <div><label>From Date</label><input type="date" value={from} onChange={e => setFrom(e.target.value)} /></div>
        <div><label>To Date</label><input type="date" value={to} onChange={e => setTo(e.target.value)} /></div>
      </div>
      <div className="chips" style={{ marginTop: 17 }}>{(['Summary', 'Book-wise', 'Language-wise', 'Payment-wise'] as Report[]).map(option =>
        <button key={option} className={`chip ${report === option ? 'on' : ''}`} onClick={() => setReport(option)}>{option}</button>)}</div>
      <div className="metric-grid stagger">
        <Metric label="एकूण विक्री" value={format(reportRevenue)} tone="gr" />
        <Metric label="एकूण पुस्तके" value={reportQuantity} tone="bl" />
        <Metric label="Online" value={format(filteredBills.filter(b => b.pay === 'Online').reduce((s, b) => s + total(b, books), 0))} />
        <Metric label="Offline" value={format(filteredBills.filter(b => b.pay === 'Cash').reduce((s, b) => s + total(b, books), 0))} />
      </div>
      <h2 className="section-title">{report}</h2>
      <div className="panel stagger">
        {report === 'Summary' ? [...filteredBills].sort((a, b) => b.no - a.no).map(bill =>
          <PanelRow key={bill.no} right={<><b>{format(total(bill, books))}</b><br />{badge(bill.pay, bill.pay === 'Online' ? 'bl' : 'gr')}</>}>
            <span>#{bill.no} · {bill.c}<small>{bill.d} {bill.tm}</small></span>
          </PanelRow>) : reportLines.map(([label, data]) =>
          <PanelRow key={label} right={<><b>{format(data.revenue)}</b><small>{data.q} पुस्तके</small></>}>{label}</PanelRow>)}
        {(report === 'Summary' ? filteredBills.length === 0 : reportLines.length === 0) &&
          <div className="empty">या तारखांमध्ये विक्री नाही. तारखा बदलून पहा.</div>}
      </div>
      <div className="actions-grid" style={{ marginTop: 14, maxWidth: 500 }}>
        <button className="btn outline" onClick={() => window.print()}>PDF</button>
        <button className="btn outline" onClick={() => notify('Excel download (demo)')}>Excel</button>
      </div>
      <h2 className="section-title">आठवड्याची विक्री</h2>
      <div className="panel" style={{ padding: '20px 12px 12px' }}>
        <div className="chart-bars">{[50, 65, 40, 80, 60, 100, 70].map((height, i) => <i key={i} className={i === 5 ? 'strong' : ''} style={{ height: `${height}%` }} />)}</div>
        <div className="chart-labels">{['सो', 'मं', 'बु', 'गु', 'शु', 'श', 'र'].map(day => <span key={day}>{day}</span>)}</div>
      </div>
      <article className="print-report">
        <header className="print-report-header">
          <div className="print-brand-mark"><LotusMark width="38" height="30" /></div>
          <div><strong>ISKCON पंढरपूर</strong><span>श्रीमद्भगवद्गीता पुस्तक केंद्र</span></div>
          <div className="print-period"><b>{report} Report</b><span>{from} — {to}</span></div>
        </header>
        <div className="print-summary">
          <div><small>एकूण विक्री</small><b>{format(reportRevenue)}</b></div>
          <div><small>दिलेला Discount</small><b>{format(reportDiscount)}</b></div>
          <div><small>एकूण Bills</small><b>{filteredBills.length}</b></div>
          <div><small>विकलेली पुस्तके</small><b>{reportQuantity}</b></div>
        </div>
        <table className="print-table">
          <thead>
            {report === 'Summary'
              ? <tr><th>Bill #</th><th>दिनांक</th><th>ग्राहक</th><th>पुस्तके</th><th>Payment</th><th>एकूण</th></tr>
              : <tr><th>{reportLabel}</th><th>पुस्तके</th><th>एकूण विक्री</th></tr>}
          </thead>
          <tbody>
            {report === 'Summary'
              ? [...filteredBills].sort((a, b) => b.no - a.no).map(bill =>
                <tr key={bill.no}>
                  <td>#{bill.no}</td><td>{bill.d}</td><td>{bill.c}</td>
                  <td>{quantity(bill)}</td><td>{bill.pay}</td><td>{format(total(bill, books))}</td>
                </tr>)
              : reportLines.map(([label, data]) =>
                <tr key={label}><td>{label}</td><td>{data.q}</td><td>{format(data.revenue)}</td></tr>)}
            {filteredBills.length === 0 && <tr><td colSpan={report === 'Summary' ? 6 : 3}>या तारखांमध्ये विक्री नाही.</td></tr>}
          </tbody>
        </table>
        <footer className="print-report-footer">ISKCON पंढरपूर · पुस्तक व्यवस्थापन</footer>
      </article>
    </>;

    return <>
      <PageHead heading="अधिक" sub="अधिक पर्याय आणि अॅप सेटिंग्ज" />
      <div className="panel">
        <PanelRow tap onClick={() => go('stock')} right={<ChevronRight size={18} color="var(--mute)" />}>
          <span>Stock Status आणि Low Stock<small>सध्याचा पुस्तक साठा पहा</small></span>
        </PanelRow>
      </div>
      <button className="btn outline" style={{ marginTop: 16, minWidth: 230 }} onClick={() => setDark(value => !value)}>
        {dark ? <Sun size={17} /> : <Moon size={17} />} Dark / Light mode बदला
      </button>
      <div className="panel" style={{ marginTop: 24, padding: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Sparkles size={19} color="var(--saf)" /><span>ISKCON पंढरपूर · पुस्तक व्यवस्थापन</span>
      </div>
    </>;
  };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><LotusMark width="31" height="25" /></div><div><strong>ISKCON पंढरपूर</strong><small>पुस्तक व्यवस्थापन</small></div></div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="side-nav">{navItems.map(({ key, label, icon: Icon }) =>
        <button key={key} className={`nav-item ${navKey === key ? 'active' : ''}`} onClick={() => go(key)}><Icon />{label}</button>)}</nav>
      <div className="sidebar-foot"><b>हरे कृष्ण</b>श्रीमद्भगवद्गीता पुस्तक केंद्र</div>
    </aside>
    <div className="workspace">
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="mobile-menu" aria-label="Menu" aria-expanded={mobileMenu} aria-controls="mobile-menu-panel" onClick={() => setMobileMenu(value => !value)}>{mobileMenu ? <X size={17} /> : <Menu size={17} />}</button>
          <div className="crumb">पुस्तक केंद्र <span style={{ margin: '0 7px' }}>›</span><strong>{title[screen]}</strong></div>
        </div>
        <div className="top-meta"><span className="date-pill"><SunMedium size={15} /> शनिवार, 03 ऑक्टोबर 2026</span><button className="theme-btn" aria-label="Theme toggle" onClick={() => setDark(value => !value)}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button></div>
      </header>
      {mobileMenu && <>
        <button className="mobile-menu-backdrop" aria-label="Menu बंद करा" onClick={() => setMobileMenu(false)} />
        <nav id="mobile-menu-panel" className="panel mobile-menu-panel" aria-label="मुख्य नेव्हिगेशन">
          {navItems.map(({ key, label, icon: Icon }) => <PanelRow key={key} tap onClick={() => go(key)}><span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Icon size={17} />{label}</span></PanelRow>)}
          <PanelRow tap onClick={() => go('stock')}><span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><ClipboardList size={17} />Stock Status</span></PanelRow>
        </nav>
      </>}
      <main key={screen} className="content screen-enter">{page()}</main>
    </div>
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}

export default App;
