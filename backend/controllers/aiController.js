// MATH SOLVER
const solveMath = async (req, res) => {
  try {
    const { equation } = req.body;
    if (!equation) {
      return res.status(400).json({ message: 'Equation is required' });
    }

    // Try OpenAI
    if (process.env.OPENAI_API_KEY &&
      process.env.OPENAI_API_KEY !== 'your_openai_key_here') {
      try {
        const OpenAI = require('openai');
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          max_tokens: 1500,
          messages: [
            {
              role: 'system',
              content: 'You are an expert mathematics tutor. Solve equations step by step clearly.'
            },
            {
              role: 'user',
              content: `Solve this step by step: ${equation}
              
Return ONLY valid JSON:
{
  "equation": "the original equation",
  "steps": [
    {"step": 1, "explanation": "what we do", "result": "result of this step"},
    {"step": 2, "explanation": "what we do", "result": "result of this step"}
  ],
  "finalAnswer": "the final answer",
  "explanation": "brief overall explanation"
}`
            }
          ]
        });
        const content = response.choices[0].message.content;
        const cleaned = content.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return res.status(200).json({ result: parsed });
      } catch (error) {
        console.error('OpenAI math error:', error.message);
      }
    }

    // Try Claude
    if (process.env.ANTHROPIC_API_KEY &&
      process.env.ANTHROPIC_API_KEY !== 'your_claude_api_key_here') {
      try {
        const Anthropic = require('@anthropic-ai/sdk');
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const message = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: `Solve step by step: ${equation}
Return ONLY JSON:
{
  "equation": "${equation}",
  "steps": [{"step": 1, "explanation": "...", "result": "..."}],
  "finalAnswer": "...",
  "explanation": "..."
}`
          }]
        });
        const content = message.content[0].text;
        const cleaned = content.replace(/```json|```/g, '').trim();
        return res.status(200).json({ result: JSON.parse(cleaned) });
      } catch (error) {
        console.error('Claude math error:', error.message);
      }
    }

    // Placeholder when no API key
    return res.status(200).json({
      result: {
        equation,
        steps: [
          { step: 1, explanation: 'Identify the type of equation', result: equation },
          { step: 2, explanation: 'Apply appropriate mathematical rules', result: 'Applying rules...' },
          { step: 3, explanation: 'Simplify and solve', result: 'Add API key for full solution' },
        ],
        finalAnswer: 'Add OpenAI or Claude API key for real solutions',
        explanation: `To solve "${equation}", add your API key in the backend .env file for AI-powered step-by-step solutions.`
      }
    });

  } catch (error) {
    console.error('Math solver error:', error.message);
    res.status(500).json({ message: 'Failed to solve equation' });
  }
};

module.exports = { solveMath };