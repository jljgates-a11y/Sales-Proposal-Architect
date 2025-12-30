
import React, { useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  FileText, 
  Upload, 
  ChevronRight, 
  Download, 
  Building2, 
  PieChart, 
  Sparkles, 
  ArrowLeft,
  Search,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  History,
  Image as ImageIcon
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

// --- Types ---
interface BusinessSpend {
  businessName: string;
  totalSpend: number;
  products: Record<string, number>;
}

interface ProposalData {
  summary: string;
  analysis: string;
  sponsorshipReviews: {
    name: string;
    amount: number;
    review: string;
    imagePrompt?: string;
    imageUrl?: string;
  }[];
  recommendations: {
    program: string;
    reasoning: string;
    suggestedInvestment: string;
    imagePrompt?: string;
    imageUrl?: string;
  }[];
}

// --- Utils ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Simplified CSV Parser
const parseCSV = (text: string): BusinessSpend[] => {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const businessIdx = headers.findIndex(h => h.includes('business') || h.includes('company') || h.includes('name'));
  const productIdx = headers.findIndex(h => h.includes('product') || h.includes('item'));
  const spendIdx = headers.findIndex(h => h.includes('spend') || h.includes('amount') || h.includes('total'));

  if (businessIdx === -1 || spendIdx === -1) return [];

  const map = new Map<string, BusinessSpend>();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const name = cols[businessIdx];
    const productName = productIdx !== -1 ? cols[productIdx] : 'Unknown Product';
    const spend = parseFloat(cols[spendIdx].replace(/[$,]/g, '')) || 0;

    if (!name) continue;

    if (!map.has(name)) {
      map.set(name, { businessName: name, totalSpend: 0, products: {} });
    }

    const entry = map.get(name)!;
    entry.totalSpend += spend;
    entry.products[productName] = (entry.products[productName] || 0) + spend;
  }

  return Array.from(map.values()).sort((a, b) => b.totalSpend - a.totalSpend);
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
};

// --- Components ---

const App = () => {
  const [businesses, setBusinesses] = useState<BusinessSpend[]>([]);
  const [pdfFiles, setPdfFiles] = useState<{ name: string; data: string }[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessSpend | null>(null);
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [visualLoading, setVisualLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadDemoCase = () => {
    const acxiom: BusinessSpend = {
      businessName: "Acxiom",
      totalSpend: 78590,
      products: {
        "Cloud Infrastructure Summit 2025": 45000,
        "Executive Dinner Series - Q3": 15000,
        "Lead Gen Campaign (Managed)": 18590
      }
    };
    
    const demoProposal: ProposalData = {
      summary: `In 2025, Acxiom established a strategic foothold in the Conway business community with a cumulative investment of ${formatCurrency(78590)}. This partnership focused on high-level networking and direct lead generation. For 2026, we recommend transitioning from tactical spend to a "Community Leader" model, aligning the Acxiom brand with our most prestigious annual programming to maximize regional visibility and talent recruitment.`,
      analysis: `Acxiom's 2025 investment was split primarily between large-scale summits and intimate executive sessions. While highly effective for short-term ROI, your brand has the opportunity to claim "Title" and "Presenting" status on our marquee events, which offers unparalleled multi-channel recognition and aligns Acxiom with the city's long-term growth and education initiatives.`,
      sponsorshipReviews: [
        {
          name: "Cloud Infrastructure Summit 2025",
          amount: 45000,
          review: "A cornerstone 2025 activation. Acxiom's footprint dominated the technology track, providing a critical platform for regional cloud-competency messaging.",
          imageUrl: "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80&w=800"
        },
        {
          name: "Executive Dinner Series - Q3",
          amount: 15000,
          review: "Facilitated exclusive access to 12 key regional decision-makers. This high-touch environment proved ideal for Acxiom's complex enterprise value propositions.",
          imageUrl: "https://images.unsplash.com/photo-1551818255-e6e10975bc17?auto=format&fit=crop&q=80&w=800"
        },
        {
          name: "Lead Gen Campaign (Managed)",
          amount: 18590,
          review: "Successfully targeted Conway's emerging tech professionals. This campaign demonstrated the efficiency of our first-party community data in driving MQLs.",
          imageUrl: "https://images.unsplash.com/photo-1551288049-bbdac8a28a16?auto=format&fit=crop&q=80&w=800"
        }
      ],
      recommendations: [
        {
          program: "Presenting Sponsor: 2026 Annual Meeting",
          reasoning: "As the largest business event in Faulkner County with 1,000+ attendees, this provides Acxiom with the premier keynote platform and dominant branding as the region's technology anchor.",
          suggestedInvestment: "$15,000",
          imageUrl: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=1200"
        },
        {
          program: "Title Sponsor: Toad Suck Daze Tinkerfest",
          reasoning: "A powerful community engagement opportunity that positions Acxiom at the center of STEM education. Align with Conway’s largest festival to reach over 100,000 visitors through high-impact, hands-on learning activations.",
          suggestedInvestment: "$7,500",
          imageUrl: "https://images.unsplash.com/photo-1564325724739-bae0bd08bc4f?auto=format&fit=crop&q=80&w=1200"
        },
        {
          program: "Title Sponsor: 2026 Women in Business",
          reasoning: "Take the lead in honoring the over 80 female leaders who have shaped Conway's economy. With 350+ attendees, this title sponsorship offers prominent recognition and exclusive speaking opportunities to advocate for diversity in tech.",
          suggestedInvestment: "$7,500",
          imageUrl: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&q=80&w=1200"
        }
      ]
    };

    setBusinesses([acxiom]);
    setSelectedBusiness(acxiom);
    setProposal(demoProposal);
    setError(null);
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = parseCSV(text);
      if (data.length === 0) throw new Error("Could not parse spending data. Ensure CSV has Business and Spend columns.");
      setBusinesses(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    
    setLoading(true);
    try {
      const newPdfs = await Promise.all(files.map(async (f: File) => ({
        name: f.name,
        data: await fileToBase64(f)
      })));
      setPdfFiles(prev => [...prev, ...newPdfs]);
      setError(null);
    } catch (err: any) {
      setError("Failed to process PDFs");
    } finally {
      setLoading(false);
    }
  };

  const generateImage = async (prompt: string): Promise<string | undefined> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `A professional, high-end business photograph for a sales proposal representing: ${prompt}. Cinematic lighting, corporate aesthetic, clean composition, 16:9 aspect ratio.` }]
        },
        config: {
          imageConfig: { aspectRatio: "16:9" }
        }
      });
      
      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : undefined;
    } catch (e) {
      console.error("Image generation failed:", e);
      return undefined;
    }
  };

  const generateProposal = async (biz: BusinessSpend) => {
    setSelectedBusiness(biz);
    setLoading(true);
    setVisualLoading(false);
    setProposal(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const pdfParts = pdfFiles.map(pdf => ({
        inlineData: {
          mimeType: 'application/pdf',
          data: pdf.data
        }
      }));

      const prompt = `
        You are a world-class Senior Sales Executive. 
        Create a highly personalized 2026 Sales Proposal for the business: ${biz.businessName}.

        Here is their 2025 Spending Data:
        Total Spend: ${formatCurrency(biz.totalSpend)}
        Product Breakdown: ${JSON.stringify(biz.products)}

        Review the attached Events Blueprint PDF.
        Structure the proposal as follows:
        1. Professional summary of their 2025 relationship.
        2. "sponsorshipReviews" array: For each 2025 product, write a brief impact statement.
        3. Identify 3 specific 2026 "Strategic Recommendations" from the PDF.
        
        REQUIRED RECOMMENDATIONS (if found in PDF, use these):
        - Annual Meeting Presenting Sponsor
        - Toad Suck Daze Tinkerfest Title Sponsor
        - Women in Business Title Sponsor

        Response Format (Strict JSON):
        {
          "summary": "Professional executive summary",
          "analysis": "Data-driven analysis",
          "sponsorshipReviews": [
            { "name": "Product Name", "amount": 0.0, "review": "Impact statement", "imagePrompt": "Image description for 2025 retrospective" }
          ],
          "recommendations": [
            { "program": "Program Name", "reasoning": "Strategy linked to PDF text", "suggestedInvestment": "$Amount", "imagePrompt": "Image description for 2026 program" }
          ]
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [...pdfParts, { text: prompt }] }],
        config: { responseMimeType: 'application/json' }
      });

      const result: ProposalData = JSON.parse(response.text || '{}');
      setProposal(result);
      
      setVisualLoading(true);
      const recImages = await Promise.all(result.recommendations.map(r => generateImage(r.imagePrompt || r.program)));
      const reviewImages = await Promise.all(result.sponsorshipReviews.map(s => generateImage(s.imagePrompt || s.name)));

      setProposal(prev => {
        if (!prev) return null;
        return {
          ...prev,
          recommendations: prev.recommendations.map((r, i) => ({ ...r, imageUrl: recImages[i] })),
          sponsorshipReviews: prev.sponsorshipReviews.map((s, i) => ({ ...s, imageUrl: reviewImages[i] }))
        };
      });

    } catch (err: any) {
      setError("Failed to generate proposal: " + err.message);
    } finally {
      setLoading(false);
      setVisualLoading(false);
    }
  };

  const filteredBusinesses = useMemo(() => 
    businesses.filter(b => b.businessName.toLowerCase().includes(search.toLowerCase())),
    [businesses, search]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 no-print">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Sparkles className="text-indigo-600" />
            Proposal Architect
          </h1>
          <p className="text-slate-500 mt-1">Transform cumulative data into strategic growth proposals.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={loadDemoCase}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors group"
          >
            <Eye size={18} className="text-indigo-500" />
            <span className="text-sm font-semibold">Preview Demo (Acxiom)</span>
          </button>
          
          <label className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 cursor-pointer transition-colors group">
            <FileSpreadsheet size={18} className="text-slate-400 group-hover:text-indigo-500" />
            <span className="text-sm font-medium">Upload Master Spend</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
          </label>
          
          <label className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 cursor-pointer transition-colors group">
            <FileText size={18} className="text-slate-400 group-hover:text-indigo-500" />
            <span className="text-sm font-medium">Upload Programs (PDF)</span>
            <input type="file" accept=".pdf" multiple className="hidden" onChange={handlePdfUpload} />
          </label>
        </div>
      </header>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 no-print">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {!selectedBusiness ? (
          <div className="lg:col-span-12 no-print">
            {businesses.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 flex flex-col items-center justify-center text-center">
                <div className="bg-slate-100 p-6 rounded-full mb-6">
                  <Upload size={48} className="text-slate-400" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Start by uploading your data</h2>
                <p className="text-slate-500 max-w-md mb-8">
                  Upload the 2025 cumulative spending CSV to see your business directory and begin generating proposals.
                </p>
                <button 
                  onClick={loadDemoCase}
                  className="flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
                >
                  <Eye size={18} />
                  See a sample output for "Acxiom"
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                  <Search className="text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search businesses..." 
                    className="flex-1 bg-transparent outline-none text-lg"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <div className="text-sm text-slate-400 font-medium">
                    {filteredBusinesses.length} Organizations Found
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredBusinesses.map((biz) => (
                    <button
                      key={biz.businessName}
                      onClick={() => generateProposal(biz)}
                      className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-left hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="bg-slate-50 p-3 rounded-xl text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-colors">
                            <Building2 size={24} />
                          </div>
                          <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1 group-hover:text-indigo-400 transition-all" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{biz.businessName}</h3>
                        <p className="text-slate-500 text-sm mt-1">
                          2025 Total: <span className="font-semibold text-slate-700">{formatCurrency(biz.totalSpend)}</span>
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-12">
            <div className="flex items-center justify-between mb-8 no-print">
              <button 
                onClick={() => { setSelectedBusiness(null); setProposal(null); }}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium"
              >
                <ArrowLeft size={20} />
                Back to Dashboard
              </button>
              <div className="flex gap-3">
                <button 
                  onClick={() => window.print()}
                  className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                  <Download size={18} />
                  Download PDF
                </button>
              </div>
            </div>

            {loading ? (
              <div className="bg-white rounded-3xl p-20 flex flex-col items-center justify-center text-center proposal-shadow">
                <div className="relative mb-8">
                  <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                  {visualLoading ? "Generating Contextual Visuals..." : "Synthesizing Strategic Proposal..."}
                </h2>
                <p className="text-slate-500 max-w-md italic">
                  {visualLoading ? "Drafting custom imagery for each partnership box." : "Analyzing 2025 performance data and matching with 2026 programming."}
                </p>
              </div>
            ) : proposal ? (
              <div className="bg-white proposal-shadow rounded-none md:rounded-3xl min-h-[11in] w-full p-8 md:p-16 text-slate-800 border border-slate-200 print:border-0">
                <div className="flex flex-col md:flex-row justify-between items-start border-b border-slate-100 pb-10 mb-10 gap-6">
                  <div>
                    <div className="text-indigo-600 font-bold tracking-tighter text-xl mb-4">2026 STRATEGIC PARTNERSHIP PROPOSAL</div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-2">
                      {selectedBusiness.businessName}
                    </h1>
                    <p className="text-slate-400 font-medium">Prepared for 2026 Fiscal Planning Cycle</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 min-w-[200px]">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">2025 Total Value</div>
                    <div className="text-3xl font-black text-indigo-600">{formatCurrency(selectedBusiness.totalSpend)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                  <div className="md:col-span-2 space-y-10">
                    <section>
                      <h2 className="text-sm font-black text-indigo-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <CheckCircle2 size={16} />
                        Executive Summary
                      </h2>
                      <div className="text-lg text-slate-600 leading-relaxed font-light">
                        {proposal.summary}
                      </div>
                    </section>
                    <section>
                      <h2 className="text-sm font-black text-indigo-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <PieChart size={16} />
                        Strategic Relationship Analysis
                      </h2>
                      <div className="text-slate-600 leading-relaxed">
                        {proposal.analysis}
                      </div>
                    </section>
                  </div>
                  <aside className="space-y-8">
                    <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50">
                      <h3 className="text-indigo-900 font-bold mb-4 text-sm">2025 Spend Allocation</h3>
                      <div className="space-y-3">
                        {Object.entries(selectedBusiness.products).map(([name, val]: [string, number]) => (
                          <div key={name} className="flex justify-between items-center group">
                            <span className="text-xs text-slate-500 font-medium group-hover:text-indigo-600 transition-colors">{name}</span>
                            <span className="text-xs font-bold text-slate-700">{formatCurrency(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </aside>
                </div>

                {/* 2025 Portfolio Retrospective Boxes */}
                <section className="mt-12 mb-20">
                  <h2 className="text-sm font-black text-indigo-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                    <History size={16} />
                    2025 Portfolio Retrospective
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {proposal.sponsorshipReviews.map((item, idx) => (
                      <div key={idx} className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                        <div className="h-32 bg-slate-100 relative overflow-hidden">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <ImageIcon size={32} />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <span className="text-[10px] font-black text-white bg-slate-900/50 backdrop-blur-md px-2 py-0.5 rounded">
                              {formatCurrency(item.amount)}
                            </span>
                          </div>
                        </div>
                        <div className="p-5">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-2 truncate" title={item.name}>
                            {item.name}
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {item.review}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 2026 Strategic Recommendations */}
                <section className="mt-16">
                  <h2 className="text-sm font-black text-indigo-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                    <Sparkles size={16} />
                    2026 Strategic Recommendations
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {proposal.recommendations.map((rec, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-3xl border border-slate-100 flex flex-col overflow-hidden hover:bg-white hover:border-indigo-200 transition-all cursor-default group">
                        <div className="h-48 bg-slate-200 overflow-hidden relative">
                          {rec.imageUrl ? (
                            <img src={rec.imageUrl} alt={rec.program} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                               <ImageIcon size={48} />
                            </div>
                          )}
                          <div className="absolute bottom-4 left-4">
                            <div className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                              Priority {idx + 1}
                            </div>
                          </div>
                        </div>
                        <div className="p-8 flex flex-col justify-between flex-1">
                          <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors leading-tight">{rec.program}</h3>
                            <p className="text-slate-600 text-sm leading-relaxed mb-6 italic font-light">
                              {rec.reasoning}
                            </p>
                          </div>
                          <div className="pt-6 border-t border-slate-200/50 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Target Allocation</span>
                            <span className="text-lg font-black text-slate-900">{rec.suggestedInvestment}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="mt-20 pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between gap-10">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-2">Notes & Next Steps</h4>
                    <div className="w-full h-32 border border-slate-200 rounded-xl p-4 text-sm text-slate-400 font-light italic no-print">
                      Click here to add custom meeting notes...
                    </div>
                  </div>
                  <div className="w-64 space-y-4">
                    <div className="border-b border-slate-900 h-10"></div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Authorized Approver</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {businesses.length > 0 && !selectedBusiness && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="text-xs font-medium uppercase tracking-widest">{businesses.length} Organizations Found</span>
          </div>
        </div>
      )}
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
