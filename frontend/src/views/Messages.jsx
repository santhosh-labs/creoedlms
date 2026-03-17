import { useEffect, useState, useRef } from 'react';
import { MessageCircle, Send, Search, Image, X, Download } from 'lucide-react';
import api from '../api';

const API_BASE = api.defaults.baseURL.replace('/api', '');

export default function Messages({ user }) {
    const [contacts, setContacts]         = useState([]);
    const [search, setSearch]             = useState('');
    const [activeContact, setActiveContact] = useState(null);
    const [messages, setMessages]         = useState([]);
    const [replyText, setReplyText]       = useState('');
    const [loading, setLoading]           = useState(false);
    const [sending, setSending]           = useState(false);
    const [imagePreview, setImagePreview] = useState(null); // { file, url }
    const [lightbox, setLightbox]         = useState(null); // full-screen image
    const messagesEndRef = useRef(null);
    const fileInputRef   = useRef(null);

    useEffect(() => {
        api.get('/messages/users').then(r => setContacts(r.data)).catch(() => {});
    }, []);

    useEffect(() => {
        if (!activeContact) return;
        setLoading(true);
        api.get(`/messages/thread/${activeContact.ID}`)
           .then(r => { setMessages(r.data); scrollToBottom(); })
           .catch(() => {})
           .finally(() => setLoading(false));

        const interval = setInterval(() => {
            api.get(`/messages/thread/${activeContact.ID}`).then(r => setMessages(r.data)).catch(() => {});
        }, 5000);
        return () => clearInterval(interval);
    }, [activeContact]);

    const scrollToBottom = () => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const handleImageSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';

        // ── Client-side compression using Canvas ──────────────
        const compressImage = (file, maxWidth = 1200, quality = 0.75) =>
            new Promise((resolve) => {
                const img = new Image();
                const reader = new FileReader();
                reader.onload = ev => {
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let { width, height } = img;
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width  = maxWidth;
                        }
                        canvas.width  = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        canvas.toBlob(blob => {
                            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
                        }, 'image/jpeg', quality);
                    };
                    img.src = ev.target.result;
                };
                reader.readAsDataURL(file);
            });

        const compressed = await compressImage(file);
        const url = URL.createObjectURL(compressed);
        const saving = ((file.size - compressed.size) / file.size * 100).toFixed(0);
        console.log(`🗜️ Compressed: ${(file.size/1024).toFixed(0)}KB → ${(compressed.size/1024).toFixed(0)}KB (${saving}% saved)`);
        setImagePreview({ file: compressed, url, originalName: file.name });
    };

    const clearImagePreview = () => {
        if (imagePreview) URL.revokeObjectURL(imagePreview.url);
        setImagePreview(null);
    };

    const sendMessage = async () => {
        if ((!replyText.trim() && !imagePreview) || !activeContact || sending) return;
        setSending(true);
        const text = replyText;
        const imgPreview = imagePreview;
        setReplyText('');
        setImagePreview(null);

        // Optimistic update
        const optimisticId = `opt_${Date.now()}`;
        setMessages(prev => [...prev, {
            ID: optimisticId,
            SenderID: user.id,
            Message: text,
            ImageUrl: imgPreview ? imgPreview.url : null,
            SentAt: new Date().toISOString(),
            optimistic: true,
        }]);
        scrollToBottom();

        try {
            if (imgPreview) {
                const formData = new FormData();
                formData.append('image', imgPreview.file);
                if (text) formData.append('caption', text);
                await api.post(`/messages/${activeContact.ID}/image`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post(`/messages/${activeContact.ID}`, { message: text });
            }
            const r = await api.get(`/messages/thread/${activeContact.ID}`);
            setMessages(r.data);
            scrollToBottom();
            if (imgPreview) URL.revokeObjectURL(imgPreview.url);
        } catch {
            setMessages(prev => prev.filter(m => m.ID !== optimisticId));
            alert('Failed to send message.');
        } finally {
            setSending(false);
        }
    };

    const filteredContacts = contacts.filter(c =>
        c.Name.toLowerCase().includes(search.toLowerCase()) ||
        (c.StudentCode && c.StudentCode.toLowerCase().includes(search.toLowerCase()))
    );

    const getImageSrc = (msg) => {
        if (!msg.ImageUrl) return null;
        if (msg.optimistic) return msg.ImageUrl; // blob URL
        return `${API_BASE}${msg.ImageUrl}`;
    };

    return (
        <div className="content-wrapper" style={{ height: 'calc(100vh - 84px)', paddingBottom: '0' }}>
            {/* Lightbox */}
            {lightbox && (
                <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: '24px', right: '32px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                        <X size={20} />
                    </button>
                    <a href={lightbox} download target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: '24px', right: '80px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', textDecoration: 'none' }}>
                        <Download size={18} />
                    </a>
                    <img src={lightbox} alt="Full size" onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '12px', objectFit: 'contain', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
                </div>
            )}

            <div style={{ display: 'flex', height: '100%', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--surface)' }}>

                {/* Left Sidebar - Contact List */}
                <div style={{ width: '320px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)' }}>
                        <h2 style={{ margin: '0 0 12px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MessageCircle size={18} style={{ color: 'var(--primary)' }}/> Messages
                        </h2>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}/>
                            <input
                                placeholder="Search by name or code..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px 8px 32px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '13px' }}
                            />
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {contacts.length === 0 ? (
                            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No contacts available. You must be assigned to an active class.</div>
                        ) : filteredContacts.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No matches found.</div>
                        ) : filteredContacts.map(c => (
                            <div key={c.ID} onClick={() => setActiveContact(c)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', background: activeContact?.ID === c.ID ? 'rgba(26,174,100,0.08)' : 'transparent', transition: 'background 0.15s' }}>
                                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg,#1aae64,#0d8a4f)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', flexShrink: 0 }}>
                                    {c.Name.charAt(0)}
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', color: activeContact?.ID === c.ID ? 'var(--primary)' : 'var(--text-main)' }}>{c.Name}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        {c.Type} {c.StudentCode && `• ${c.StudentCode}`}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Area - Chat View */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--surface)', minWidth: 0 }}>
                    {!activeContact ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--bg)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                <MessageCircle size={32} style={{ color: 'var(--border)' }}/>
                            </div>
                            <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Your Messages</h3>
                            <p style={{ margin: '8px 0 0', fontSize: '13px' }}>Select a contact to start chatting. You can send text & images!</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg)' }}>
                                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg,#1aae64,#0d8a4f)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px' }}>
                                    {activeContact.Name.charAt(0)}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{activeContact.Name}</h3>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{activeContact.Type} {activeContact.StudentCode && `• ${activeContact.StudentCode}`}</span>
                                </div>
                            </div>

                            {/* Messages Container */}
                            <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg)' }}>
                                {loading && messages.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>Loading messages...</div>
                                ) : messages.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                        <MessageCircle size={32} style={{ color: 'var(--border)' }}/>
                                        <span>No messages yet. Say hello! 👋</span>
                                        <span style={{ fontSize: '12px' }}>You can send text or images using the 📷 button below</span>
                                    </div>
                                ) : (
                                    messages.map((m) => {
                                        const isMine = m.SenderID === user.id;
                                        const imgSrc = getImageSrc(m);
                                        return (
                                            <div key={m.ID} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                                                {/* Image bubble */}
                                                {imgSrc && (
                                                    <div style={{ maxWidth: '280px', marginBottom: m.Message ? '6px' : '0', cursor: 'pointer', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.12)', border: '2px solid rgba(26,174,100,0.15)', opacity: m.optimistic ? 0.7 : 1 }}
                                                        onClick={() => !m.optimistic && setLightbox(imgSrc)}>
                                                        <img src={imgSrc} alt="Shared image" style={{ display: 'block', width: '100%', maxHeight: '260px', objectFit: 'cover' }} />
                                                        {m.optimistic && (
                                                            <div style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', textAlign: 'center', fontSize: '11px', padding: '4px' }}>Sending...</div>
                                                        )}
                                                    </div>
                                                )}
                                                {/* Text bubble */}
                                                {m.Message && (
                                                    <div style={{
                                                        maxWidth: '70%',
                                                        padding: '10px 16px',
                                                        borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                        background: isMine ? 'linear-gradient(135deg,#1aae64,#0d8a4f)' : 'var(--surface)',
                                                        color: isMine ? '#fff' : 'var(--text-main)',
                                                        fontSize: '14px',
                                                        lineHeight: '1.5',
                                                        border: isMine ? 'none' : '1px solid var(--border)',
                                                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                                        wordBreak: 'break-word',
                                                    }}>
                                                        {m.Message}
                                                    </div>
                                                )}
                                                {/* Timestamp */}
                                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', padding: '0 4px' }}>
                                                    {new Date(m.SentAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Image Preview Banner */}
                            {imagePreview && (
                                <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                        <img src={imagePreview.url} alt="Preview" style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '10px', border: '2px solid var(--primary)' }} />
                                        <button onClick={clearImagePreview} style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--danger)', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                                            <X size={12} />
                                        </button>
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                        <strong style={{ color: 'var(--text-main)' }}>{imagePreview.originalName || imagePreview.file.name}</strong><br/>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                                            {(imagePreview.file.size / 1024).toFixed(1)} KB
                                            <span style={{ background: 'rgba(26,174,100,0.12)', color: 'var(--primary)', fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '20px' }}>
                                                🗜️ Compressed
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Input Area */}
                            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: '20px', padding: '6px 6px 6px 16px', transition: 'border-color 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                                    {/* Image attach button */}
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        title="Attach Image"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: imagePreview ? 'var(--primary)' : 'var(--text-muted)', padding: '6px', display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'color 0.2s' }}
                                    >
                                        <Image size={20} />
                                    </button>
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />

                                    {/* Text input */}
                                    <input
                                        style={{ flex: 1, border: 'none', outline: 'none', padding: '8px 0', fontSize: '14px', background: 'transparent', color: 'var(--text-main)', minWidth: 0 }}
                                        placeholder={imagePreview ? 'Add a caption (optional)...' : 'Type a message...'}
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                    />

                                    {/* Send button */}
                                    <button
                                        onClick={sendMessage}
                                        disabled={(!replyText.trim() && !imagePreview) || sending}
                                        style={{
                                            width: '38px', height: '38px', borderRadius: '50%', border: 'none', flexShrink: 0,
                                            background: (replyText.trim() || imagePreview) && !sending ? 'linear-gradient(135deg,#1aae64,#0d8a4f)' : 'var(--border)',
                                            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: (replyText.trim() || imagePreview) && !sending ? 'pointer' : 'not-allowed',
                                            transition: 'background 0.2s', boxShadow: (replyText.trim() || imagePreview) ? '0 2px 8px rgba(26,174,100,0.35)' : 'none'
                                        }}
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'center' }}>
                                    📷 Click the image icon to attach a photo • Max 10 MB • JPG, PNG, GIF, WebP supported
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
