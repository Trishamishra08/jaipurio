import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';

const ReturnPolicy = () => {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const res = await api.get('/policies/return');
        setPolicy(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, []);

  if (loading) {
    return <div className="p-12 text-center"><div className="animate-spin w-10 h-10 border-4 border-brand-dark mx-auto border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 max-w-4xl font-sans">
      <div className="text-center mb-6">
        <h1 className="text-xl md:text-2xl font-serif font-black text-brand-dark uppercase tracking-widest mb-2">Return & Refund Policy</h1>
        <div className="h-1 w-12 bg-brand-pink mx-auto rounded-full" />
      </div>

      <div className="bg-white/50 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-brand-pink/10 shadow-xl shadow-brand-pink/[0.02] space-y-6">
        <div 
          className="prose max-w-none text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-medium"
          dangerouslySetInnerHTML={{ __html: policy?.content || 'Return & Refund Policy coming soon...' }}
        />
        <div className="pt-8 border-t border-brand-pink/5 text-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
            © 2026 Sada Bharat Pvt Ltd. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReturnPolicy;
