exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed.' }),
    };
  }

  try {
    const { name, email, message, source = 'Contact form', service = 'General inquiry' } = JSON.parse(event.body || '{}');

    if (!name || !email || !message) {
      return {
        statusCode: 400,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: 'Name, email, and message are required.' }),
      };
    }

    const mailResponse = await fetch('https://formsubmit.co/ajax/krishnayadavabc123@gmail.com', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        source,
        service,
        message,
        _subject: `Portfolio ${source} from ${name}`,
        _template: 'table',
      }),
    });

    if (!mailResponse.ok) {
      throw new Error('Email delivery failed.');
    }

    return {
      statusCode: 201,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        message: 'Message sent to Krishna by email.',
      }),
    };
  } catch {
    return {
      statusCode: 400,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid request.' }),
    };
  }
};
