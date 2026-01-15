
import React, { useState } from 'react';
import { Sparkles, Download, Image as ImageIcon, Loader2, Wand2, Share2, Info } from 'lucide-react';
import { generateCampaignPoster } from '../services/geminiService';

const CampaignGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    const url = await generateCampaignPoster(prompt);
    setPosterUrl(url);
    setGenerating(false);
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in duration-700">
      <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight">AI Campaign Studio</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Imagen 4.0 Visual Generation</p>
          </div>
        </div>
      </div>

      <div className="p-8 grid md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Campaign Vision</label>
            <textarea 
              rows={4}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 font-bold text-sm resize-none"
              placeholder="e.g. A futuristic heart made of blood drops, calling for young donors in Bangalore."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={generating || !prompt}
            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            {generating ? 'RENDERING ARTWORK...' : 'GENERATE PROFESSIONAL POSTER'}
          </button>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
            <Info className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase">
              Pro-Tip: Use descriptive keywords like "Photorealistic", "Minimalist", or "Cinematic Lighting" for the best medical design results.
            </p>
          </div>
        </div>

        <div className="relative group min-h-[300px] flex items-center justify-center bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2.5rem] overflow-hidden">
          {posterUrl ? (
            <>
              <img src={posterUrl} className="w-full h-full object-cover animate-in zoom-in duration-500" alt="AI Generated Campaign" />
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                <a href={posterUrl} download="RedConnect_Campaign.png" className="p-4 bg-white text-slate-900 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-2xl">
                  <Download className="w-6 h-6" />
                </a>
                <button className="p-4 bg-white text-slate-900 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-2xl">
                  <Share2 className="w-6 h-6" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center text-slate-300">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Visualization</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignGenerator;
