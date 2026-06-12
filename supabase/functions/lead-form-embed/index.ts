import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'text/html',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const tenant_id = pathParts[pathParts.length - 2];
    const form_slug = pathParts[pathParts.length - 1];

    if (!tenant_id || !form_slug) {
      return new Response('Form not found', { status: 404 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get form configuration
    const { data: form, error } = await supabase
      .from('lead_forms')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('slug', form_slug)
      .eq('is_active', true)
      .single();

    if (error || !form) {
      return new Response('Form not found', { status: 404 });
    }

    // Generate form HTML
    const html = generateFormHTML(form, tenant_id, form_slug);

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    return new Response('Error loading form', { status: 500 });
  }
});

function generateFormHTML(form: any, tenantId: string, formSlug: string): string {
  const fields = form.fields || [];
  
  const fieldsHTML = fields.map((field: any) => {
    const required = field.required ? 'required' : '';
    const requiredLabel = field.required ? ' *' : '';
    
    return `
      <div class="form-field">
        <label for="${field.name}">${field.label}${requiredLabel}</label>
        <input 
          type="${field.type}" 
          id="${field.name}" 
          name="${field.name}" 
          ${required}
          placeholder="${field.placeholder || ''}"
        >
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${form.title}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${form.background_color};
      color: ${form.text_color};
      padding: 20px;
      line-height: 1.6;
    }
    
    .form-container {
      max-width: 400px;
      margin: 0 auto;
    }
    
    h2 {
      font-size: 24px;
      margin-bottom: 8px;
      color: ${form.text_color};
    }
    
    .description {
      color: ${form.text_color}cc;
      margin-bottom: 24px;
      font-size: 14px;
    }
    
    .form-field {
      margin-bottom: 16px;
    }
    
    label {
      display: block;
      margin-bottom: 6px;
      font-size: 14px;
      font-weight: 500;
    }
    
    input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.2s;
    }
    
    input:focus {
      outline: none;
      border-color: ${form.primary_color};
    }
    
    button {
      width: 100%;
      padding: 14px 24px;
      background: ${form.primary_color};
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    
    button:hover {
      opacity: 0.9;
    }
    
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .success-message {
      display: none;
      text-align: center;
      padding: 40px 20px;
    }
    
    .success-message.show {
      display: block;
    }
    
    .success-icon {
      width: 64px;
      height: 64px;
      background: ${form.primary_color};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }
    
    .success-icon::after {
      content: "✓";
      color: white;
      font-size: 32px;
    }
    
    .error-message {
      color: #ef4444;
      font-size: 14px;
      margin-top: 8px;
      display: none;
    }
    
    .error-message.show {
      display: block;
    }
    
    .powered-by {
      text-align: center;
      margin-top: 20px;
      font-size: 12px;
      color: ${form.text_color}80;
    }
    
    .powered-by a {
      color: ${form.primary_color};
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="form-container">
    <form id="leadForm">
      <h2>${form.title}</h2>
      ${form.description ? `<p class="description">${form.description}</p>` : ''}
      
      ${fieldsHTML}
      
      <div class="error-message" id="errorMessage"></div>
      
      <button type="submit" id="submitBtn">${form.submit_button_text}</button>
    </form>
    
    <div class="success-message" id="successMessage">
      <div class="success-icon"></div>
      <h3>${form.success_message}</h3>
    </div>
    
    <div class="powered-by">
      Powered by <a href="https://funnelswift.com" target="_blank">FunnelSwift</a>
    </div>
  </div>

  <script>
    const form = document.getElementById('leadForm');
    const submitBtn = document.getElementById('submitBtn');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
      errorMessage.classList.remove('show');
      
      const formData = new FormData(form);
      const data = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });
      
      try {
        const response = await fetch('${Deno.env.get('SUPABASE_URL')}/functions/v1/lead-form-submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tenant_id: '${tenantId}',
            form_slug: '${formSlug}',
            form_data: data,
            referrer: window.parent.location?.href
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          form.style.display = 'none';
          successMessage.classList.add('show');
          
          ${form.success_redirect_url ? `
          setTimeout(() => {
            window.parent.location.href = '${form.success_redirect_url}';
          }, 2000);
          ` : ''}
        } else {
          throw new Error(result.error || 'Submission failed');
        }
      } catch (error) {
        errorMessage.textContent = error.message || 'Something went wrong. Please try again.';
        errorMessage.classList.add('show');
        submitBtn.disabled = false;
        submitBtn.textContent = '${form.submit_button_text}';
      }
    });
  </script>
</body>
</html>
  `;
}
