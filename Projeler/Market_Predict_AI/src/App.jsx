import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Activity, Zap, Info, ArrowUpRight, ArrowDownRight, RefreshCw, 
  BarChart3, PieChart, Lock, User, LayoutDashboard, Settings, LogOut, PlusCircle, Trash2,
  MessageSquare, ChevronRight, CheckCircle2, X, Home, BarChart2, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabaseClient';

// Mock Data for Hal Market
const INITIAL_MARKET_DATA = [
  { name: '08:00', price: 12.5, prediction: 12.6 },
  { name: '10:00', price: 13.2, prediction: 13.1 },
  { name: '12:00', price: 14.8, prediction: 14.5 },
  { name: '14:00', price: 14.2, prediction: 14.9 },
  { name: '16:00', price: 15.5, prediction: 15.8 },
  { name: '18:00', price: 16.1, prediction: 16.5 },
  { name: '20:00', price: 15.8, prediction: 17.2 },
];

const INITIAL_PRODUCTS = [
  { id: 1, name: "DOLMA BİBER Y.SERA", price: 40.0, yesterdayPrice: 40.0, status: 'stable', confidence: '95%', image: '/assets/pepper.png' },
  { id: 2, name: "DOLMA BİBER ZAFER", price: 28.0, yesterdayPrice: 28.0, status: 'stable', confidence: '90%', image: '/assets/pepper.png' },
  { id: 3, name: "KIL BİBER", price: 25.0, yesterdayPrice: 25.0, status: 'stable', confidence: '85%', image: '/assets/pepper.png' },
  { id: 4, name: "DOMATES (1)", price: 65.0, yesterdayPrice: 65.0, status: 'stable', confidence: '98%', image: '/assets/tomato.png' },
  { id: 5, name: "DOMATES (2)", price: 75.0, yesterdayPrice: 75.0, status: 'stable', confidence: '98%', image: '/assets/tomato.png' },
  { id: 6, name: "PATLICAN KAZANLI", price: 13.0, yesterdayPrice: 16.0, status: 'down', confidence: '88%', image: '/assets/eggplant.png' },
  { id: 7, name: "SALATALIK HOMURLU", price: 8.0, yesterdayPrice: 13.0, status: 'down', confidence: '92%', image: '/assets/cucumber.png' },
  { id: 8, name: "SALATALIK ANAMUR", price: 10.0, yesterdayPrice: 15.0, status: 'down', confidence: '90%', image: '/assets/cucumber.png' },
  { id: 9, name: "FASULYE CİNA AÇIK", price: 75.0, yesterdayPrice: 80.0, status: 'down', confidence: '85%', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=60&w=100&h=100' },
  { id: 10, name: "KABAK", price: 15.0, yesterdayPrice: 15.0, status: 'stable', confidence: '80%', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=60&w=100&h=100' },
];

const MARKET_ROLES = ["Çiftçi", "Komisyoncu", "Tüccar", "Manav", "Market"];
const MARKET_PREDICTIONS = ["Artar", "Sabit Kalır", "Düşer"];

const MarketAdviceModal = ({ isOpen, onClose, initialProducts, onVoteSubmitted }) => {
  const [step, setStep] = useState(1);
  const [roles, setRoles] = useState(MARKET_ROLES);
  const [products, setProducts] = useState(initialProducts.map(p => p.name));
  const [predictions, setPredictions] = useState(MARKET_PREDICTIONS);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedPrediction, setSelectedPrediction] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync products if they change in the parent
  useEffect(() => {
    if (initialProducts) {
      const names = initialProducts.map(p => p.name);
      setProducts(prev => {
        const uniqueNames = new Set([...names, ...prev]);
        return Array.from(uniqueNames);
      });
    }
  }, [initialProducts]);

  if (!isOpen) return null;

  const getAutoImage = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('domates')) return '/assets/tomato.png';
    if (lowerName.includes('salatalık')) return '/assets/cucumber.png';
    if (lowerName.includes('biber')) return '/assets/pepper.png';
    if (lowerName.includes('patlıcan')) return '/assets/eggplant.png';
    return `https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=60&w=100&h=100`;
  };

  const handleNext = async () => {
    if (step === 1 && selectedRole) setStep(2);
    else if (step === 2 && selectedProduct) {
      setIsSubmitting(true);
      try {
        const exists = initialProducts.some(p => p.name.toLowerCase() === selectedProduct.toLowerCase());
        if (!exists) {
          await supabase.from('products').insert([{
            name: selectedProduct,
            price: 0,
            yesterday_price: 0,
            image: getAutoImage(selectedProduct),
            status: 'up',
            confidence: '50%'
          }]);
        }
        setStep(3);
      } catch (err) {
        console.error("Error auto-adding product:", err);
        setStep(3); // Continue anyway for better UX
      } finally {
        setIsSubmitting(false);
      }
    }
    else if (step === 3 && selectedPrediction) {
      setIsSubmitting(true);
      try {
        const { error } = await supabase.from('votes').insert([{
          role: selectedRole,
          product_name: selectedProduct,
          prediction: selectedPrediction
        }]);
        
        if (error) throw error;
        if (onVoteSubmitted) await onVoteSubmitted();
        setStep(4);
      } catch (err) {
        console.error("Error saving vote:", err);
        alert("Bağlantı hatası: Tavsiyeniz kaydedilemedi. Lütfen internetinizi veya veritabanı ayarlarınızı kontrol edin.");
        // Still move to step 4 for demo purposes if requested, but better to stay on 3
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleAddCustom = () => {
    if (!customInput) return;
    if (step === 1) {
      setRoles([...roles, customInput]);
      setSelectedRole(customInput);
    } else if (step === 2) {
      setProducts([...products, customInput]);
      setSelectedProduct(customInput);
    } else {
      setPredictions([...predictions, customInput]);
      setSelectedPrediction(customInput);
    }
    setCustomInput('');
  };

  const resetAndClose = () => {
    setStep(1);
    setSelectedRole('');
    setSelectedProduct('');
    setSelectedPrediction('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={resetAndClose}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card modal-content" 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem' }}>Piyasa Tavsiyesi</h2>
          <button onClick={resetAndClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <div className="step-indicator">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`}></div>
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step-dot ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`step-dot ${step >= 4 ? 'active' : ''}`}></div>
        </div>

        {step === 1 && (
          <div>
            <h3>Piyasadaki sıfatınız nedir?</h3>
            <div className="selection-grid">
              {roles.map(role => (
                <div 
                  key={role} 
                  className={`selection-item ${selectedRole === role ? 'selected' : ''}`}
                  onClick={() => setSelectedRole(role)}
                >
                  {role}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
              <input 
                placeholder="Diğer sıfat..." 
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                style={{ padding: '0.5rem' }}
              />
              <button onClick={handleAddCustom} className="btn-secondary" style={{ padding: '0.5rem' }}>
                <PlusCircle size={20} />
              </button>
            </div>
            <button 
              disabled={!selectedRole || isSubmitting}
              onClick={handleNext}
              className="btn-primary" 
              style={{ width: '100%', marginTop: '2rem', opacity: selectedRole ? 1 : 0.5 }}
            >
              {isSubmitting ? 'İşleniyor...' : <>İleri <ChevronRight size={18} style={{ verticalAlign: 'middle' }} /></>}
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3>Hangi ürün için tavsiyede bulunacaksınız?</h3>
            <div className="selection-grid">
              {products.map(prod => (
                <div 
                  key={prod} 
                  className={`selection-item ${selectedProduct === prod ? 'selected' : ''}`}
                  onClick={() => setSelectedProduct(prod)}
                >
                  {prod}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
              <input 
                placeholder="Diğer ürün..." 
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                style={{ padding: '0.5rem' }}
              />
              <button onClick={handleAddCustom} className="btn-secondary" style={{ padding: '0.5rem' }}>
                <PlusCircle size={20} />
              </button>
            </div>
            <button 
              disabled={!selectedProduct || isSubmitting}
              onClick={handleNext}
              className="btn-primary" 
              style={{ width: '100%', marginTop: '2rem', opacity: selectedProduct ? 1 : 0.5 }}
            >
              {isSubmitting ? 'Ürün Ekleniyor...' : <>İleri <ChevronRight size={18} style={{ verticalAlign: 'middle' }} /></>}
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3>{selectedProduct} için fiyat tahmininiz nedir?</h3>
            <div className="selection-grid">
              {predictions.map(pred => (
                <div 
                  key={pred} 
                  className={`selection-item ${selectedPrediction === pred ? 'selected' : ''}`}
                  onClick={() => setSelectedPrediction(pred)}
                >
                  {pred}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
              <input 
                placeholder="Diğer tahmin..." 
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                style={{ padding: '0.5rem' }}
              />
              <button onClick={handleAddCustom} className="btn-secondary" style={{ padding: '0.5rem' }}>
                <PlusCircle size={20} />
              </button>
            </div>
            <button 
              disabled={!selectedPrediction || isSubmitting}
              onClick={handleNext}
              className="btn-primary" 
              style={{ width: '100%', marginTop: '2rem', opacity: selectedPrediction ? 1 : 0.5 }}
            >
              {isSubmitting ? 'Tavsiye Yayınlanıyor...' : 'Tavsiyeyi Yayınla'}
            </button>
          </div>
        )}

        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <CheckCircle2 size={64} color="var(--success)" style={{ margin: '0 auto 1.5rem' }} />
            <h3 style={{ marginBottom: '1rem' }}>Tebrikler!</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Bir <strong>{selectedRole}</strong> olarak <strong>{selectedProduct}</strong> ürünü için <strong>"{selectedPrediction}"</strong> tavsiyeniz piyasa analizine eklendi.
            </p>
            <button onClick={resetAndClose} className="btn-primary" style={{ width: '100%' }}>Kapat</button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const Login = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === '8888') {
      onLogin();
    } else {
      setError('Hatalı şifre! Lütfen tekrar deneyin.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card" 
      style={{ maxWidth: '400px', margin: '100px auto', textAlign: 'center' }}
    >
      <div style={{ background: 'rgba(0, 210, 255, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', marginBottom: '1.5rem' }}>
        <Lock size={32} color="var(--accent-primary)" style={{ margin: '0 auto' }} />
      </div>
      <h2 style={{ marginBottom: '0.5rem' }}>Admin Girişi</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Yönetim paneline erişmek için şifrenizi girin.</p>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>ŞİFRE</label>
          <input 
            type="password" 
            placeholder="****" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '1rem' }}>{error}</p>}
        <button type="submit" className="btn-primary" style={{ width: '100%' }}>Giriş Yap</button>
      </form>
    </motion.div>
  );
};

const AdminDashboard = ({ products, setProducts, onLogout }) => {
  const [activeTab, setActiveTab] = useState('products');
  const [editingPriceProduct, setEditingPriceProduct] = useState(null);
  const [historyPrices, setHistoryPrices] = useState(Array(7).fill(''));
  const [newProduct, setNewProduct] = useState({ name: '', price: '', trend: '', status: 'up', confidence: '' });

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price) return;
    
    const getAutoImage = (name) => {
      const lowerName = name.toLowerCase();
      if (lowerName.includes('domates')) return '/assets/tomato.png';
      if (lowerName.includes('salatalık')) return '/assets/cucumber.png';
      if (lowerName.includes('biber')) return '/assets/pepper.png';
      if (lowerName.includes('patlıcan')) return '/assets/eggplant.png';
      return `https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=60&w=100&h=100`;
    };

    try {
      const { data, error } = await supabase.from('products').insert([{
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        yesterday_price: parseFloat(newProduct.price),
        image: getAutoImage(newProduct.name),
        status: 'up',
        confidence: '100%'
      }]).select();
      
      if (error) throw error;
      setProducts([...products, data[0]]);
    } catch (err) {
      console.error("Error adding product:", err);
      setProducts([...products, { ...newProduct, id: Date.now(), price: parseFloat(newProduct.price), yesterdayPrice: parseFloat(newProduct.price), image: getAutoImage(newProduct.name) }]);
    }
    
    setNewProduct({ name: '', price: '', trend: '', status: 'up', confidence: '' });
  };

  const deleteProduct = async (id) => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      console.error("Error deleting product:", err);
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const savePriceHistory = async () => {
    if (!editingPriceProduct) return;
    
    const dates = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const updates = historyPrices.map((p, i) => ({
      product_name: editingPriceProduct.name,
      date: dates[i],
      price: parseFloat(p) || 0
    }));

    try {
      const { error } = await supabase.from('price_history').upsert(updates, { onConflict: ['product_name', 'date'] });
      if (error) throw error;
      setEditingPriceProduct(null);
      alert("Fiyat geçmişi kaydedildi!");
    } catch (err) {
      console.error("Error saving history:", err);
    }
  };

  return (
    <div className="animate-fade">
      <header>
        <div className="logo">
          <LayoutDashboard size={32} />
          <span>ADMİN PANELİ</span>
        </div>
        <button onClick={onLogout} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
          <LogOut size={18} /> Çıkış Yap
        </button>
      </header>

      <div className="admin-nav">
        <div className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>Ürün Yönetimi</div>
        <div className={`admin-nav-item ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>İstatistikler</div>
        <div className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Sistem Ayarları</div>
      </div>

      <div className="glass-card">
        {editingPriceProduct ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h3>{editingPriceProduct.name} - Son 7 Günlük Fiyatlar</h3>
              <button onClick={() => setEditingPriceProduct(null)} className="btn-secondary">Geri Dön</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
              {historyPrices.map((p, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return (
                  <div key={i} className="glass-card" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                    </div>
                    <input 
                      type="number" 
                      value={p} 
                      onChange={(e) => {
                        const newPrices = [...historyPrices];
                        newPrices[i] = e.target.value;
                        setHistoryPrices(newPrices);
                      }}
                      placeholder="₺0.00"
                    />
                  </div>
                );
              })}
            </div>
            <button onClick={savePriceHistory} className="btn-primary" style={{ marginTop: '2rem', width: '100%' }}>Kaydet</button>
          </div>
        ) : (
          <>
            {activeTab === 'products' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h3>Kayıtlı Ürünler</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input placeholder="Ürün Adı" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} />
                    <input placeholder="Fiyat (₺)" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} />
                    <button onClick={addProduct} className="btn-primary"><PlusCircle size={20} /></button>
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <th style={{ padding: '1rem' }}>ÜRÜN</th>
                      <th style={{ padding: '1rem' }}>FİYAT</th>
                      <th style={{ padding: '1rem' }}>İŞLEMLER</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(prod => (
                      <tr key={prod.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '1rem' }}>{prod.name}</td>
                        <td style={{ padding: '1rem' }}>₺{prod.price}</td>
                        <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => {
                              setEditingPriceProduct(prod);
                              setHistoryPrices(Array(7).fill(prod.price));
                            }} 
                            className="btn-secondary" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                          >
                            Geçmiş Düzenle
                          </button>
                          <button onClick={() => deleteProduct(prod.id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'stats' && (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <Activity size={48} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
                <h3>Piyasa Verileri Yükleniyor...</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Bu modül bir sonraki güncelleme ile aktif olacaktır.</p>
              </div>
            )}

            {activeTab === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3>Genel Ayarlar</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                  <div>
                    <h4>Otomatik Güncelleme</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fiyatları her 15 dakikada bir otomatik yenile.</p>
                  </div>
                  <div style={{ width: '40px', height: '20px', background: 'var(--success)', borderRadius: '10px' }}></div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const ProductHomeView = ({ products }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="glass-card"
      style={{ marginTop: '1rem' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h3>Güncel Piyasa Durumu</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Ürün bazlı fiyat karşılaştırması ve kullanıcı beklentileri</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--success)' }}></div> Artar
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--warning)' }}></div> Sabit
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--danger)' }}></div> Düşer
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <th style={{ padding: '1rem' }}>ÜRÜN ADI</th>
              <th style={{ padding: '1rem' }}>BUGÜN (₺)</th>
              <th style={{ padding: '1rem' }}>DÜN (₺)</th>
              <th style={{ padding: '1rem' }}>DEĞİŞİM</th>
              <th style={{ padding: '1rem' }}>PİYASA TAHMİNLERİ (ANKET)</th>
            </tr>
          </thead>
          <tbody>
            {products.map(prod => {
              const upVotes = prod.votes?.up || 0;
              const stableVotes = prod.votes?.stable || 0;
              const downVotes = prod.votes?.down || 0;
              const totalVotes = upVotes + stableVotes + downVotes || 1; // Avoid div zero
              const upPercent = (upVotes / totalVotes) * 100;
              const stablePercent = (stableVotes / totalVotes) * 100;
              const downPercent = (downVotes / totalVotes) * 100;

              return (
                <tr key={prod.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.3s' }}>
                  <td style={{ padding: '1.25rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {prod.image ? (
                        <img 
                          src={prod.image} 
                          alt={prod.name} 
                          style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', background: 'rgba(255,255,255,0.05)' }} 
                        />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Zap size={20} color="var(--accent-primary)" />
                        </div>
                      )}
                      <span style={{ fontWeight: '600' }}>{prod.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1rem', fontSize: '1.1rem', fontWeight: '700' }}>₺{prod.price?.toFixed(2)}</td>
                  <td style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)' }}>₺{prod.yesterdayPrice?.toFixed(2)}</td>
                  <td style={{ padding: '1.25rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: prod.status === 'up' ? 'var(--success)' : 'var(--danger)' }}>
                      {prod.status === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      {prod.yesterdayPrice ? (((prod.price - prod.yesterdayPrice) / prod.yesterdayPrice) * 100).toFixed(1) : 0}%
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1rem', minWidth: '250px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', display: 'flex', overflow: 'hidden' }}>
                        <div style={{ width: `${upPercent}%`, background: 'var(--success)' }}></div>
                        <div style={{ width: `${stablePercent}%`, background: 'var(--warning)' }}></div>
                        <div style={{ width: `${downPercent}%`, background: 'var(--danger)' }}></div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span>{upVotes} Artar</span>
                        <span>{stableVotes} Sabit</span>
                        <span>{downVotes} Düşer</span>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

const StatsView = ({ products }) => {
  const [selectedProduct, setSelectedProduct] = useState(products[0] || {});
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedProduct.name) return;
      try {
        const { data, error } = await supabase
          .from('price_history')
          .select('date, price')
          .eq('product_name', selectedProduct.name)
          .order('date', { ascending: true });
        
        if (error) throw error;
        if (data && data.length > 0) {
          setHistory(data.map(item => ({
            name: new Date(item.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
            price: item.price,
            prediction: item.price * 1.05 // Fake prediction for UI
          })));
        } else {
          setHistory(INITIAL_MARKET_DATA);
        }
      } catch (err) {
        console.error("Error fetching history:", err);
        setHistory(INITIAL_MARKET_DATA);
      }
    };
    fetchHistory();
  }, [selectedProduct]);
  
  return (
    <div className="dashboard-grid animate-fade">
      {/* Main Prediction Chart */}
      <div className="col-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{ height: '500px', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1.5rem' }}>{selectedProduct.name} Analizi</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Son 7 Günlük Fiyat Trendi</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>₺{selectedProduct.price?.toFixed(2)}</div>
              <div className={`badge ${selectedProduct.status === 'up' ? 'badge-up' : 'badge-down'}`}>
                {selectedProduct.status === 'up' ? '+' : ''}{selectedProduct.yesterdayPrice ? (((selectedProduct.price - selectedProduct.yesterdayPrice) / selectedProduct.yesterdayPrice) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>

          <div style={{ flex: 1, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ background: '#141820', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="price" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={3} />
                <Line type="monotone" dataKey="prediction" stroke="var(--success)" strokeDasharray="5 5" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
      {/* ... existing rest ... */}

      {/* AI Insight Panel */}
      <div className="col-4">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card"
          style={{ height: '500px', overflowY: 'auto' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Zap size={24} color="var(--warning)" />
            <h3 style={{ fontSize: '1.2rem' }}>AI İçgörüleri</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Tahmin Güveni</p>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>{selectedProduct.confidence}</div>
              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '0.5rem' }}>
                <div style={{ width: selectedProduct.confidence, height: '100%', background: 'var(--success)', borderRadius: '2px' }}></div>
              </div>
            </div>

            <div style={{ padding: '0.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Neden Yükseliyor?</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <Info size={16} color="var(--accent-primary)" />
                  Bölgesel arz-talep dengesizliği
                </li>
                <li style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <Info size={16} color="var(--accent-primary)" />
                  Hava şartları ve lojistik faktörler
                </li>
                <li style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <Info size={16} color="var(--accent-primary)" />
                  İhracat verilerindeki artış trendi
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Product Selector */}
      <div className="col-12">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          {products.map(prod => (
            <div 
              key={prod.id}
              onClick={() => setSelectedProduct(prod)}
              className="glass-card"
              style={{ cursor: 'pointer', padding: '1rem', border: selectedProduct.id === prod.id ? '1px solid var(--accent-primary)' : '' }}
            >
              <span style={{ fontWeight: '600' }}>{prod.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MainApp = ({ products, onAdminClick, onRefresh }) => {
  const [activeView, setActiveView] = useState('home'); // home, stats
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const refreshData = () => {
    setIsRefreshing(true);
    onRefresh().finally(() => {
      setTimeout(() => setIsRefreshing(false), 800);
    });
  };

  return (
    <div className="animate-fade">
      <MarketAdviceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialProducts={products}
        onVoteSubmitted={onRefresh}
      />
      
      {/* Header */}
      <header>
        <div className="logo">
          <Zap size={32} />
          <span>HAL PREDICT AI</span>
        </div>
        
        <nav style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <button 
            onClick={() => setActiveView('home')}
            style={{ 
              background: activeView === 'home' ? 'var(--accent-primary)' : 'none',
              color: activeView === 'home' ? 'var(--bg-primary)' : 'white',
              border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <Home size={18} /> Anasayfa
          </button>
          <button 
            onClick={() => setActiveView('stats')}
            style={{ 
              background: activeView === 'stats' ? 'var(--accent-primary)' : 'none',
              color: activeView === 'stats' ? 'var(--bg-primary)' : 'white',
              border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <BarChart2 size={18} /> İstatistikler
          </button>
        </nav>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary"
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <MessageSquare size={18} /> Piyasa Tavsiyesinde Bulun
          </button>
          <button 
            onClick={onAdminClick}
            style={{ background: 'none', border: '1px solid var(--glass-border)', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Admin Paneli
          </button>
          <button 
            onClick={refreshData}
            style={{ 
              background: 'none', border: 'none', color: 'white', cursor: 'pointer',
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
            }}
          >
            <RefreshCw size={24} />
          </button>
        </div>
      </header>

      {activeView === 'home' ? (
        <ProductHomeView products={products} />
      ) : (
        <StatsView products={products} />
      )}
    </div>
  );
};

const App = () => {
  const [view, setView] = useState('landing'); // landing, login, dashboard
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);

  const fetchData = async () => {
    try {
      // Fetch Products
      const { data: dbProducts, error: pError } = await supabase.from('products').select('*');
      if (pError) throw pError;
      
      // Fetch Votes summary
      const { data: dbVotes, error: vError } = await supabase.from('votes').select('*');
      if (vError) throw vError;

      // Merge votes into products
      const productsWithVotes = (dbProducts && dbProducts.length > 0 ? dbProducts : INITIAL_PRODUCTS).map(p => {
        const productVotes = dbVotes ? dbVotes.filter(v => v.product_name === p.name) : [];
        return {
          ...p,
          yesterdayPrice: p.yesterday_price || p.yesterdayPrice, // Map DB fields
          votes: {
            up: productVotes.filter(v => v.prediction === 'Artar').length,
            stable: productVotes.filter(v => v.prediction === 'Sabit Kalır').length,
            down: productVotes.filter(v => v.prediction === 'Düşer').length
          }
        };
      });

      setProducts(productsWithVotes);
    } catch (err) {
      console.error("Fetch error:", err);
      // Fallback stays as is
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdminAccess = () => {
    if (isAuthenticated) {
      setView('dashboard');
    } else {
      setView('login');
    }
  };

  return (
    <div className="app-container">
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <MainApp 
            key="main" 
            products={products} 
            onAdminClick={handleAdminAccess}
            onRefresh={fetchData}
          />
        )}
        
        {view === 'login' && (
          <Login 
            key="login" 
            onLogin={() => {
              setIsAuthenticated(true);
              setView('dashboard');
            }} 
          />
        )}

        {view === 'dashboard' && (
          <AdminDashboard 
            key="dashboard" 
            products={products} 
            setProducts={setProducts}
            onLogout={() => {
              setIsAuthenticated(false);
              setView('landing');
            }} 
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default App;
