import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'url', label: 'Website URL' },
  { value: 'textarea', label: 'Text Area' },
];

const DEFAULT_FIELDS = [
  { name: 'first_name', label: 'First Name', type: 'text', required: true },
  { name: 'last_name', label: 'Last Name', type: 'text', required: true },
  { name: 'email', label: 'Email Address', type: 'email', required: true },
  { name: 'phone', label: 'Phone Number', type: 'tel', required: false },
  { name: 'business_name', label: 'Company Name', type: 'text', required: false },
];

export default function LeadFormBuilder({ formId, onSave, onCancel }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('fields');
  const [availableTags, setAvailableTags] = useState([]);
  const [availableSystemTags, setAvailableSystemTags] = useState([]);
  
  // Form state
  const [form, setForm] = useState({
    name: '',
    slug: '',
    title: 'Get Your Free Demo',
    description: '',
    fields: [...DEFAULT_FIELDS],
    auto_tag_ids: [],
    auto_system_tag_ids: [],
    submit_button_text: 'Submit',
    success_message: 'Thank you! We will be in touch soon.',
    success_redirect_url: '',
    primary_color: '#5B4FFF',
    background_color: '#ffffff',
    text_color: '#1a1a1a',
    is_active: true,
  });

  useEffect(() => {
    loadTags();
    if (formId) {
      loadForm();
    }
  }, [formId]);

  const loadTags = async () => {
    // Load custom tags
    const { data: tags } = await supabase
      .from('tags')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    setAvailableTags(tags || []);

    // Load system tags
    const { data: systemTags } = await supabase
      .from('system_tags')
      .select('id, name, target_software')
      .eq('is_active', true)
      .order('name');
    setAvailableSystemTags(systemTags || []);
  };

  const loadForm = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lead_forms')
      .select('*')
      .eq('id', formId)
      .single();

    if (data && !error) {
      setForm({
        ...data,
        auto_tag_ids: data.auto_tag_ids || [],
        auto_system_tag_ids: data.auto_system_tag_ids || [],
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);

    const formData = {
      ...form,
      tenant_id: user.tenant_id,
    };

    let result;
    if (formId) {
      result = await supabase
        .from('lead_forms')
        .update(formData)
        .eq('id', formId)
        .select()
        .single();
    } else {
      result = await supabase
        .from('lead_forms')
        .insert(formData)
        .select()
        .single();
    }

    setSaving(false);
    if (result.data) {
      onSave(result.data);
    }
  };

  const addField = () => {
    setForm({
      ...form,
      fields: [
        ...form.fields,
        { name: `field_${form.fields.length + 1}`, label: 'New Field', type: 'text', required: false }
      ]
    });
  };

  const updateField = (index, updates) => {
    const newFields = [...form.fields];
    newFields[index] = { ...newFields[index], ...updates };
    setForm({ ...form, fields: newFields });
  };

  const removeField = (index) => {
    const newFields = form.fields.filter((_, i) => i !== index);
    setForm({ ...form, fields: newFields });
  };

  const moveField = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === form.fields.length - 1) return;
    
    const newFields = [...form.fields];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[swapIndex]] = [newFields[swapIndex], newFields[index]];
    setForm({ ...form, fields: newFields });
  };

  const toggleTag = (tagId, isSystem) => {
    if (isSystem) {
      const ids = form.auto_system_tag_ids;
      setForm({
        ...form,
        auto_system_tag_ids: ids.includes(tagId)
          ? ids.filter(id => id !== tagId)
          : [...ids, tagId]
      });
    } else {
      const ids = form.auto_tag_ids;
      setForm({
        ...form,
        auto_tag_ids: ids.includes(tagId)
          ? ids.filter(id => id !== tagId)
          : [...ids, tagId]
      });
    }
  };

  const generateEmbedCode = () => {
    return `<iframe 
  src="https://funnelswift.com/form/${user.tenant_id}/${form.slug}" 
  width="100%" 
  height="600" 
  frameborder="0"
  style="border: none;"
></iframe>`;
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(generateEmbedCode());
    alert('Embed code copied to clipboard!');
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">
          {formId ? 'Edit Lead Form' : 'Create Lead Form'}
        </h2>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-[#5B4FFF] text-white rounded-lg hover:bg-[#4a3fe0] disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Form'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#1e2130] p-1 rounded-lg">
        {['fields', 'settings', 'styling', 'tags', 'embed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md capitalize ${
              activeTab === tab
                ? 'bg-[#5B4FFF] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Fields Tab */}
      {activeTab === 'fields' && (
        <div className="space-y-4">
          <div className="bg-[#1e2130] rounded-lg p-4">
            <label className="block text-sm text-gray-400 mb-2">Form Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2 bg-[#0f1117] border border-[#2e3245] rounded-lg text-white"
            />
          </div>

          <div className="bg-[#1e2130] rounded-lg p-4">
            <label className="block text-sm text-gray-400 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 bg-[#0f1117] border border-[#2e3245] rounded-lg text-white"
            />
          </div>

          <div className="bg-[#1e2130] rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Form Fields</h3>
              <button
                onClick={addField}
                className="px-3 py-1 text-sm bg-[#5B4FFF] text-white rounded hover:bg-[#4a3fe0]"
              >
                + Add Field
              </button>
            </div>

            <div className="space-y-3">
              {form.fields.map((field, index) => (
                <div key={index} className="bg-[#0f1117] rounded-lg p-4">
                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-3">
                      <label className="block text-xs text-gray-400 mb-1">Field Name</label>
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateField(index, { name: e.target.value })}
                        className="w-full px-3 py-2 bg-[#1e2130] border border-[#2e3245] rounded text-white text-sm"
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-xs text-gray-400 mb-1">Label</label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                        className="w-full px-3 py-2 bg-[#1e2130] border border-[#2e3245] rounded text-white text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-400 mb-1">Type</label>
                      <select
                        value={field.type}
                        onChange={(e) => updateField(index, { type: e.target.value })}
                        className="w-full px-3 py-2 bg-[#1e2130] border border-[#2e3245] rounded text-white text-sm"
                      >
                        {FIELD_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-1 flex items-center justify-center pt-5">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(index, { required: e.target.checked })}
                          className="mr-1"
                        />
                        <span className="text-xs text-gray-400">Req</span>
                      </label>
                    </div>
                    <div className="col-span-2 flex gap-1">
                      <button
                        onClick={() => moveField(index, 'up')}
                        disabled={index === 0}
                        className="p-2 text-gray-400 hover:text-white disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveField(index, 'down')}
                        disabled={index === form.fields.length - 1}
                        className="p-2 text-gray-400 hover:text-white disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removeField(index)}
                        className="p-2 text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="bg-[#1e2130] rounded-lg p-4">
            <label className="block text-sm text-gray-400 mb-2">Form Name (Internal)</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Homepage Lead Form"
              className="w-full px-4 py-2 bg-[#0f1117] border border-[#2e3245] rounded-lg text-white"
            />
          </div>

          <div className="bg-[#1e2130] rounded-lg p-4">
            <label className="block text-sm text-gray-400 mb-2">URL Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="e.g., homepage-form"
              className="w-full px-4 py-2 bg-[#0f1117] border border-[#2e3245] rounded-lg text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used in embed URL: /form/{user.tenant_id}/<strong>{form.slug || 'your-slug'}</strong>
            </p>
          </div>

          <div className="bg-[#1e2130] rounded-lg p-4">
            <label className="block text-sm text-gray-400 mb-2">Submit Button Text</label>
            <input
              type="text"
              value={form.submit_button_text}
              onChange={(e) => setForm({ ...form, submit_button_text: e.target.value })}
              className="w-full px-4 py-2 bg-[#0f1117] border border-[#2e3245] rounded-lg text-white"
            />
          </div>

          <div className="bg-[#1e2130] rounded-lg p-4">
            <label className="block text-sm text-gray-400 mb-2">Success Message</label>
            <textarea
              value={form.success_message}
              onChange={(e) => setForm({ ...form, success_message: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 bg-[#0f1117] border border-[#2e3245] rounded-lg text-white"
            />
          </div>

          <div className="bg-[#1e2130] rounded-lg p-4">
            <label className="block text-sm text-gray-400 mb-2">
              Success Redirect URL (Optional)
            </label>
            <input
              type="url"
              value={form.success_redirect_url}
              onChange={(e) => setForm({ ...form, success_redirect_url: e.target.value })}
              placeholder="https://yoursite.com/thank-you"
              className="w-full px-4 py-2 bg-[#0f1117] border border-[#2e3245] rounded-lg text-white"
            />
          </div>

          <div className="bg-[#1e2130] rounded-lg p-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="mr-3 w-5 h-5"
              />
              <span className="text-white">Form is active</span>
            </label>
          </div>
        </div>
      )}

      {/* Styling Tab */}
      {activeTab === 'styling' && (
        <div className="space-y-4">
          <div className="bg-[#1e2130] rounded-lg p-4">
            <label className="block text-sm text-gray-400 mb-2">Primary Color (Button)</label>
            <div className="flex gap-3">
              <input
                type="color"
                value={form.primary_color}
                onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={form.primary_color}
                onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                className="flex-1 px-4 py-2 bg-[#0f1117] border border-[#2e3245] rounded-lg text-white"
              />
            </div>
          </div>

          <div className="bg-[#1e2130] rounded-lg p-4">
            <label className="block text-sm text-gray-400 mb-2">Background Color</label>
            <div className="flex gap-3">
              <input
                type="color"
                value={form.background_color}
                onChange={(e) => setForm({ ...form, background_color: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={form.background_color}
                onChange={(e) => setForm({ ...form, background_color: e.target.value })}
                className="flex-1 px-4 py-2 bg-[#0f1117] border border-[#2e3245] rounded-lg text-white"
              />
            </div>
          </div>

          <div className="bg-[#1e2130] rounded-lg p-4">
            <label className="block text-sm text-gray-400 mb-2">Text Color</label>
            <div className="flex gap-3">
              <input
                type="color"
                value={form.text_color}
                onChange={(e) => setForm({ ...form, text_color: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={form.text_color}
                onChange={(e) => setForm({ ...form, text_color: e.target.value })}
                className="flex-1 px-4 py-2 bg-[#0f1117] border border-[#2e3245] rounded-lg text-white"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-[#1e2130] rounded-lg p-4">
            <label className="block text-sm text-gray-400 mb-3">Preview</label>
            <div
              className="p-6 rounded-lg"
              style={{
                backgroundColor: form.background_color,
                color: form.text_color,
              }}
            >
              <h3 style={{ color: form.text_color }}>{form.title}</h3>
              <p className="text-sm opacity-70 mt-1" style={{ color: form.text_color }}>
                {form.description || 'Form description goes here...'}
              </p>
              <div className="mt-4 space-y-3">
                {form.fields.slice(0, 2).map((field) => (
                  <div key={field.name}>
                    <label className="text-sm" style={{ color: form.text_color }}>
                      {field.label}
                    </label>
                    <input
                      type="text"
                      disabled
                      className="w-full mt-1 px-3 py-2 rounded border text-sm"
                      style={{
                        backgroundColor: form.background_color,
                        borderColor: form.text_color + '30',
                        color: form.text_color,
                      }}
                    />
                  </div>
                ))}
              </div>
              <button
                className="mt-4 px-6 py-2 rounded text-white font-medium"
                style={{ backgroundColor: form.primary_color }}
              >
                {form.submit_button_text}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tags Tab */}
      {activeTab === 'tags' && (
        <div className="space-y-4">
          <div className="bg-[#1e2130] rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Auto-Apply Tags on Submission
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              These tags will be automatically applied when someone submits this form.
              System tags (demo triggers) will fire automations instantly!
            </p>

            {/* System Tags */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-[#5B4FFF] mb-3">
                ⚡ System Tags (Demo Triggers)
              </h4>
              <div className="flex flex-wrap gap-2">
                {availableSystemTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id, true)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      form.auto_system_tag_ids.includes(tag.id)
                        ? 'bg-[#5B4FFF] text-white'
                        : 'bg-[#0f1117] text-gray-400 hover:text-white border border-[#2e3245]'
                    }`}
                  >
                    {form.auto_system_tag_ids.includes(tag.id) && '✓ '}
                    {tag.name}
                    {tag.target_software && (
                      <span className="text-xs opacity-70 ml-1">
                        → {tag.target_software}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Tags */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">
                🏷️ Custom Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id, false)}
                    className={`px-3 py-2 rounded-lg text-sm transition ${
                      form.auto_tag_ids.includes(tag.id)
                        ? 'bg-gray-600 text-white'
                        : 'bg-[#0f1117] text-gray-400 hover:text-white border border-[#2e3245]'
                    }`}
                  >
                    {form.auto_tag_ids.includes(tag.id) && '✓ '}
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embed Tab */}
      {activeTab === 'embed' && (
        <div className="space-y-4">
          <div className="bg-[#1e2130] rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Embed This Form
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Copy and paste this code into any website to embed your lead form.
            </p>

            <div className="bg-[#0f1117] rounded-lg p-4 mb-4">
              <pre className="text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap">
                {generateEmbedCode()}
              </pre>
            </div>

            <button
              onClick={copyEmbedCode}
              className="px-4 py-2 bg-[#5B4FFF] text-white rounded-lg hover:bg-[#4a3fe0]"
            >
              📋 Copy Embed Code
            </button>
          </div>

          <div className="bg-[#1e2130] rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Direct Link
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Share this link directly with prospects.
            </p>

            <div className="bg-[#0f1117] rounded-lg p-4 mb-4">
              <code className="text-sm text-[#5B4FFF]">
                https://funnelswift.com/form/{user.tenant_id}/{form.slug || 'your-slug'}
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
