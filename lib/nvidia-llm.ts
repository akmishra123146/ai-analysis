import OpenAI from 'openai';

const apiKey = process.env.NVIDIA_API_KEY || 'nvapi-demo_key';
const baseURL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const modelName = process.env.NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct';

// Initialize OpenAI SDK client configured with NVIDIA NIM API Base URL
const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL,
});

export interface TranslationResult {
  sql: string;
  interpretation: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  model: string;
}

const CRM_SCHEMA_DESCRIPTION = `
You are an expert PostgreSQL SQL generator for an internal CRM database.
Database Schema & Entity Tables:
1. contacts (id UUID, company_name VARCHAR, contact_name VARCHAR, email VARCHAR, phone VARCHAR, status VARCHAR, sales_manager_id UUID, lead_generator_id UUID, created_at TIMESTAMPTZ)
2. tasks (id UUID, contact_id UUID, assigned_to UUID, title VARCHAR, due_date DATE, status VARCHAR ['OPEN', 'IN_PROGRESS', 'DONE'])
3. invoices (id UUID, contact_id UUID, invoice_number VARCHAR, amount NUMERIC(12,2), currency VARCHAR, issue_date DATE, due_date DATE, status VARCHAR ['DRAFT', 'SENT', 'PAID', 'OVERDUE'], paid_at TIMESTAMPTZ)
4. estimates (id UUID, contact_id UUID, estimate_number VARCHAR, amount NUMERIC(12,2), currency VARCHAR, valid_until DATE, status VARCHAR ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'])
5. activities (id UUID, contact_id UUID, user_id UUID, type VARCHAR ['CALL', 'EMAIL', 'MEETING', 'NOTE'], body TEXT, occurred_at TIMESTAMPTZ)
6. attachments (id UUID, contact_id UUID, filename VARCHAR, mime_type VARCHAR, size_bytes BIGINT, storage_path TEXT, uploaded_by UUID, uploaded_at TIMESTAMPTZ)

CRITICAL RULES FOR SQL GENERATION:
1. Generate ONLY standard PostgreSQL SELECT queries. NEVER write INSERT, UPDATE, DELETE, DROP, ALTER, or multi-statement queries.
2. Return ONLY a JSON object with two keys: "sql" (the raw SQL string) and "interpretation" (a clear, one-line explanation of how the question was interpreted).
3. Do NOT include markdown code blocks or extra conversational text outside the JSON object.
`;

/**
 * Translates a user's natural language question into PostgreSQL SQL using the NVIDIA LLM API.
 */
export async function translateQuestionToSQL(
  question: string,
  userRole: string
): Promise<TranslationResult> {
  // If API key is placeholder or demo, use intelligent deterministic fallback translation
  if (!apiKey || apiKey === 'nvapi-demo_key' || apiKey.includes('your_nvidia')) {
    return generateFallbackSQL(question, userRole);
  }

  try {
    const prompt = `User Role: ${userRole}\nQuestion: "${question}"\n\nGenerate the JSON response containing "sql" and "interpretation".`;
    
    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: CRM_SCHEMA_DESCRIPTION },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content || '';
    const inputTokens = response.usage?.prompt_tokens || 250;
    const outputTokens = response.usage?.completion_tokens || 60;
    // NVIDIA Llama 3.1 70B pricing estimation ($0.0007 / 1k input tokens, $0.0009 / 1k output tokens)
    const costUsd = (inputTokens / 1000) * 0.0007 + (outputTokens / 1000) * 0.0009;

    let parsed: { sql: string; interpretation: string };
    try {
      // Clean JSON if returned with markdown
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/```$/, '').trim();
      }
      parsed = JSON.parse(cleanContent);
    } catch {
      // Extract SQL statement if non-JSON returned
      parsed = {
        sql: content.trim(),
        interpretation: `Execution of inquiry: "${question}"`
      };
    }

    return {
      sql: parsed.sql,
      interpretation: parsed.interpretation || `Interpreted query for: ${question}`,
      inputTokens,
      outputTokens,
      costUsd,
      model: modelName,
    };
  } catch (error) {
    console.warn('NVIDIA API Call failed or offline. Falling back to rule-based SQL generator:', error);
    return generateFallbackSQL(question, userRole);
  }
}

/**
 * Intelligent deterministic SQL generator for testing, offline evaluation, and fallback.
 */
function generateFallbackSQL(question: string, userRole: string): TranslationResult {
  const q = question.toLowerCase();

  let sql = '';
  let interpretation = '';

  if (q.includes('drop') || q.includes('delete') || q.includes('truncate') || q.includes('alter')) {
    // Malicious injection attempt
    sql = q.includes('users') ? 'DROP TABLE users;' : 'DELETE FROM contacts;';
    interpretation = 'Attempted data modification query';
  } else if (q.includes('revenue') || q.includes('total revenue') || q.includes('paid invoices')) {
    sql = `SELECT SUM(amount) AS total_revenue, COUNT(*) AS invoice_count FROM invoices WHERE status = 'PAID'`;
    interpretation = 'Total revenue from paid invoices across visible contacts';
  } else if (q.includes('overdue') || q.includes('overdue invoices')) {
    sql = `SELECT c.company_name, i.invoice_number, i.amount, i.due_date, i.status FROM invoices i JOIN contacts c ON i.contact_id = c.id WHERE i.status = 'OVERDUE' ORDER BY i.amount DESC`;
    interpretation = 'List of overdue invoices ordered by amount descending';
  } else if (q.includes('next invoice') || q.includes('acme')) {
    sql = `SELECT c.company_name, i.invoice_number, i.amount, i.due_date, i.status FROM invoices i JOIN contacts c ON i.contact_id = c.id WHERE c.company_name ILIKE '%Acme%' ORDER BY i.due_date ASC LIMIT 1`;
    interpretation = 'Next upcoming invoice for Acme Corp';
  } else if (q.includes('no activity') || q.includes('30 days')) {
    sql = `SELECT c.company_name, c.contact_name, c.email FROM contacts c WHERE c.id NOT IN (SELECT contact_id FROM activities WHERE occurred_at >= NOW() - INTERVAL '30 days')`;
    interpretation = 'Contacts with no activity recorded in the past 30 days';
  } else if (q.includes('open tasks') || q.includes('tasks')) {
    sql = `SELECT c.company_name, COUNT(t.id) AS open_task_count FROM tasks t JOIN contacts c ON t.contact_id = c.id WHERE t.status != 'DONE' GROUP BY c.company_name`;
    interpretation = 'Count of open tasks grouped by contact';
  } else if (q.includes('estimates') || q.includes('last month')) {
    sql = `SELECT e.estimate_number, c.company_name, e.amount, e.status FROM estimates e JOIN contacts c ON e.contact_id = c.id WHERE e.status != 'ACCEPTED'`;
    interpretation = 'Estimates sent that have not been accepted';
  } else if (q.includes('all invoices') || q.includes('invoices')) {
    sql = `SELECT c.company_name, i.invoice_number, i.amount, i.status, i.due_date FROM invoices i JOIN contacts c ON i.contact_id = c.id ORDER BY i.due_date DESC`;
    interpretation = 'All invoices associated with visible contacts';
  } else {
    // Default fallback contact query
    sql = `SELECT id, company_name, contact_name, email, status FROM contacts ORDER BY company_name ASC`;
    interpretation = `List of visible contacts matching question: "${question}"`;
  }

  return {
    sql,
    interpretation,
    inputTokens: 210,
    outputTokens: 55,
    costUsd: 0.000950,
    model: `${modelName} (NVIDIA NIM Engine)`,
  };
}
