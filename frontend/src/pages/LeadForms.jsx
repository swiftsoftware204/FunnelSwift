import React, { useState, useEffect } from 'react';
import { Plus, ExternalLink, BarChart3, Copy, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import LeadFormBuilder from '../components/LeadFormBuilder';

export default function LeadForms() {
  const { user } = useAuth();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [viewingSubmissions, setViewingSubmissions] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lead_forms')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setForms(data);
    }
    setLoading(false);
  };

  const loadSubmissions = async (formId) => {
    const { data, error } = await supabase
      .from('lead_form_submissions')
      .select(`
        *,
        contact:contact_id(first_name, last_name, email, phone)
      `)
      .eq('form_id', formId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setSubmissions(data);
    }
  };

  const handleDelete = async (formId) => {
    if (!confirm('Are you sure you want to delete this form?')) return;

    await supabase
      .from('lead_forms')
      .delete()
      .eq('id', formId);

    loadForms();
  };

  const copyEmbedCode = (form) => {
    const code = `<iframe 
  src="https://funnelswift.com/form/${user.tenant_id}/${form.slug}" 
  width="100%" 
  height="600" 
  frameborder="0"
  style="border: none;"
></iframe>`;
    navigator.clipboard.writeText(code);
    alert('Embed code copied!');
  };

  const openSubmissions = async (form) => {
    setViewingSubmissions(form);
    await loadSubmissions(form.id);
  };

  if (showBuilder || editingForm) {
    return (
      <LeadFormBuilder
        formId={editingForm?.id}
        onSave={() => {
          setShowBuilder(false);
          setEditingForm(null);
          loadForms();
        }}
        onCancel={() => {
          setShowBuilder(false);
          setEditingForm(null);
        }}
      />
    );
  }

  if (viewingSubmissions) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">{viewingSubmissions.title}</h2>
            <p className="text-gray-400">Submissions</p>
          </div>
          <button
            onClick={() => setViewingSubmissions(null)}
            className="px-4 py-2 text-gray-400 hover:text-white"
          >
            ← Back to Forms
          </button>
        </div>

        <div className="bg-[#1e2130] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#0f1117]">
              <tr>
                <th className="text-left p-4 text-gray-400 font-medium">Contact</th>
                <th className="text-left p-4 text-gray-400 font-medium">Email</th>
                <th className="text-left p-4 text-gray-400 font-medium">Phone</th>
                <th className="text-left p-4 text-gray-400 font-medium">Date</th>
                <th className="text-left p-4 text-gray-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub.id} className="border-t border-[#2e3245]">
                  <td className="p-4 text-white">
                    {sub.contact?.first_name} {sub.contact?.last_name}
                  </td>
                  <td className="p-4 text-gray-300">{sub.contact?.email}</td>
                  <td className="p-4 text-gray-300">{sub.contact?.phone}</td>
                  <td className="p-4 text-gray-400 text-sm">
                    {new Date(sub.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      sub.status === 'processed'
                        ? 'bg-green-500/20 text-green-400'
                        : sub.status === 'failed'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {submissions.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              No submissions yet
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Lead Forms</h1>
          <p className="text-gray-400">Create embeddable forms to capture leads</p>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#5B4FFF] text-white rounded-lg hover:bg-[#4a3fe0]"
        >
          <Plus size={20} />
          Create Form
        </button>
      </div>

      {/* Forms Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : forms.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-[#1e2130] rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="text-gray-400" size={24} />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No forms yet</h3>
          <p className="text-gray-400 mb-4">Create your first lead capture form</p>
          <button
            onClick={() => setShowBuilder(true)}
            className="px-4 py-2 bg-[#5B4FFF] text-white rounded-lg hover:bg-[#4a3fe0]"
          >
            Create Form
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((form) => (
            <div
              key={form.id}
              className="bg-[#1e2130] rounded-lg p-5 hover:bg-[#252836] transition"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-white">{form.title}</h3>
                <span className={`px-2 py-1 rounded text-xs ${
                  form.is_active
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {form.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                {form.description || 'No description'}
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <BarChart3 size={14} />
                  <span>{form.submission_count} submissions</span>
                </div>
                <div className="flex items-center gap-1">
                  <ExternalLink size={14} />
                  <span>{form.embed_count} embeds</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openSubmissions(form)}
                  className="flex-1 px-3 py-2 bg-[#0f1117] text-gray-300 rounded hover:bg-[#2e3245] text-sm"
                >
                  Submissions
                </button>
                <button
                  onClick={() => copyEmbedCode(form)}
                  className="p-2 bg-[#0f1117] text-gray-300 rounded hover:bg-[#2e3245]"
                  title="Copy embed code"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => setEditingForm(form)}
                  className="p-2 bg-[#0f1117] text-gray-300 rounded hover:bg-[#2e3245]"
                  title="Edit form"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(form.id)}
                  className="p-2 bg-[#0f1117] text-red-400 rounded hover:bg-red-500/20"
                  title="Delete form"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
