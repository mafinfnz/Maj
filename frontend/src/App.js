import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageSquare, Book, X, Plus, Mic, AudioLines, Moon, Sun, ChevronRight, Settings } from 'lucide-react';

const App = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('laws');
  const [searchQuery, setSearchQuery] = useState('');
  const [laws, setLaws] = useState([]);
  const [filteredLaws, setFilteredLaws] = useState([]);
  const [selectedLaw, setSelectedLaw] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [aiQuery, setAiQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [toggleKey, setToggleKey] = useState(localStorage.getItem('overlay_hotkey') || 'F9');
  const [showSettings, setShowSettings] = useState(false);
  const [isRecordingKey, setIsRecordingKey] = useState(false);

  const chatEndRef = useRef(null);

  // Keyboard Hotkey Listener
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isRecordingKey) {
        event.preventDefault();
        const key = event.key;
        setToggleKey(key);
        localStorage.setItem('overlay_hotkey', key);
        setIsRecordingKey(false);
        return;
      }

      if (event.key === toggleKey) {
        setIsOpen(prev => !prev);
      }
      if (event.key === 'Escape' && isOpen) {
        if (showSettings) setShowSettings(false);
        else if (selectedLaw) setSelectedLaw(null);
        else setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleKey, isRecordingKey, showSettings, selectedLaw]);

  useEffect(() => {
    fetch('http://localhost:5000/api/laws')
      .then(res => res.json())
      .then(data => {
        setLaws(data.laws || []);
        setFilteredLaws(data.laws || []);
        setLastUpdated(data.last_updated);
      })
      .catch(err => console.error("Failed to fetch laws:", err));
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredLaws(laws);
      return;
    }
    const results = laws.filter(law =>
      law.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      law.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      law.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredLaws(results);
  }, [searchQuery, laws]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!aiQuery.trim()) return;

    const newMessages = [...chatMessages, { role: 'user', content: aiQuery }];
    setChatMessages(newMessages);
    setAiQuery('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiQuery }),
      });
      const data = await response.json();
      setChatMessages([...newMessages, { role: 'ai', content: data.response }]);
    } catch (error) {
      setChatMessages([...newMessages, { role: 'ai', content: 'Ошибка связи с сервером.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const categories = ['УК', 'ПК', 'ДК', 'АК', 'Конституция', 'ЭК', 'ТК'];

  return (
    <div className={`${isDarkMode ? 'dark' : ''} h-screen w-screen flex items-center justify-center font-sans p-10 transition-colors duration-500`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-0"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed top-5 right-5 liquid-glass p-3 rounded-full z-50 text-inherit"
        >
          <Book size={24} />
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
            className="liquid-glass w-full max-w-5xl h-[80vh] rounded-[2rem] overflow-hidden flex flex-col z-10 shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-black/5 dark:border-white/10">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-inherit">Majestic Laws</h1>
                <p className="text-xs opacity-50 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Last updated: {lastUpdated}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-inherit"
                >
                  <Settings size={20} />
                </button>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-inherit"
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab('laws')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'laws' ? 'bg-black/5 dark:bg-white/10 shadow-sm' : 'opacity-40 hover:opacity-70'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Book size={16} /> Laws
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('ai')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'ai' ? 'bg-black/5 dark:bg-white/10 shadow-sm' : 'opacity-40 hover:opacity-70'}`}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare size={16} /> Legal AI
                    </div>
                  </button>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <AnimatePresence mode="wait">
                {activeTab === 'laws' ? (
                  <motion.div
                    key="laws"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col overflow-hidden"
                  >
                    <div className="flex-1 overflow-hidden flex flex-col p-6">
                      <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                        <input
                          type="text"
                          placeholder="Search for laws, articles, keywords..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full glass-input-wrapper rounded-2xl py-3 pl-12 pr-4 outline-none text-sm text-inherit placeholder:opacity-30"
                        />
                      </div>

                      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                        {filteredLaws.length > 0 ? (
                          filteredLaws.map((law, idx) => (
                            <motion.div
                              key={idx}
                              layoutId={`law-${idx}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.02 }}
                              onClick={() => setSelectedLaw(law)}
                              className="glass-card p-5 rounded-2xl cursor-pointer"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-medium text-inherit">{law.title}</h3>
                                <span className="text-[10px] bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full opacity-50">{law.category}</span>
                              </div>
                              <p className="text-xs opacity-40 line-clamp-2">{law.content}</p>
                            </motion.div>
                          ))
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center opacity-20">
                            <Search size={48} className="mb-4" />
                            <p>No results found</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Category Selector (Per User Request) */}
                    <div className="px-6 py-4 border-t border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 flex gap-2 overflow-x-auto scrollbar-hide">
                      <button
                         onClick={() => setSearchQuery('')}
                         className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${searchQuery === '' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-black/5 dark:bg-white/5 opacity-60'}`}
                      >
                        ALL LAWS
                      </button>
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSearchQuery(cat)}
                          className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${searchQuery === cat ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-black/5 dark:bg-white/5 opacity-60'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="ai"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col p-6"
                  >
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4">
                      <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 text-sm opacity-60 leading-relaxed max-w-[80%]">
                        Здравствуйте! Я ваш юридический помощник по законам Portland. Задавайте вопросы, например: "Как дефать 17.1 УК?"
                      </div>
                      {chatMessages.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                            msg.role === 'user' ? 'bg-blue-600/30 border border-blue-500/30' : 'bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-sm'
                          }`}>
                            <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl flex gap-1">
                            <span className="w-1.5 h-1.5 bg-current opacity-30 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-current opacity-30 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1.5 h-1.5 bg-current opacity-30 rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <div className="relative group">
                      <div className="glass-input-wrapper rounded-full p-2 pl-4 pr-3 flex items-center gap-3 shadow-lg">
                        <Plus size={20} className="opacity-40 cursor-pointer hover:opacity-70 transition-colors" />
                        <input
                          type="text"
                          placeholder="Спросите ChatGPT"
                          value={aiQuery}
                          onChange={(e) => setAiQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="flex-1 bg-transparent border-none outline-none text-sm py-2 placeholder:opacity-20 text-inherit"
                        />
                        <div className="flex items-center gap-3 pr-2">
                           <Mic size={20} className="opacity-40 cursor-pointer hover:opacity-70 transition-colors" />
                           <div className="w-8 h-8 rounded-full bg-black dark:bg-white flex items-center justify-center cursor-pointer hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-md" onClick={handleSendMessage}>
                             <AudioLines size={18} className="text-white dark:text-black" />
                           </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Controls / Status */}
            <div className="px-6 py-4 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-[10px] opacity-30 uppercase tracking-widest font-bold">
              <div className="flex gap-6">
                <span>ESC - Close</span>
                <button onClick={() => setShowSettings(true)} className="hover:opacity-100 transition-opacity uppercase">{toggleKey} - Toggle Overlay</button>
              </div>
              <div className="flex items-center gap-2">
                <Settings size={12} />
                <span>Portland Official Data</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-10"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowSettings(false)} />
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="liquid-glass w-full max-w-md rounded-[2rem] overflow-hidden flex flex-col z-10 relative"
            >
              <div className="p-8 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-inherit">Settings</h2>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Overlay Hotkey</p>
                    <p className="text-xs opacity-40">Key to open/close the laws</p>
                  </div>
                  <button
                    onClick={() => setIsRecordingKey(true)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${isRecordingKey ? 'bg-red-500 text-white animate-pulse' : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20'}`}
                  >
                    {isRecordingKey ? 'Press any key...' : toggleKey}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Interface Theme</p>
                    <p className="text-xs opacity-40">Switch between light and dark</p>
                  </div>
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="p-2 bg-black/5 dark:bg-white/10 rounded-xl"
                  >
                    {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {selectedLaw && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-10"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedLaw(null)} />
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="liquid-glass w-full max-w-4xl max-h-[90vh] rounded-[2rem] overflow-hidden flex flex-col z-10 relative"
            >
              <div className="p-8 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold mb-1 text-inherit">{selectedLaw.title}</h2>
                  <p className="text-xs opacity-40">{selectedLaw.category} • {selectedLaw.url}</p>
                </div>
                <button onClick={() => setSelectedLaw(null)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 overflow-y-auto flex-1 text-sm leading-relaxed opacity-80 whitespace-pre-wrap selection:bg-blue-500/30">
                {selectedLaw.content}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
