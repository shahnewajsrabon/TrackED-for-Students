export async function addEventToGoogleCalendar(title: string, description: string, startTime: string) {
  const token = sessionStorage.getItem('google_access_token');
  if (!token) return { success: false, message: 'Google Calendar not connected.' };

  const startDate = new Date(startTime);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // default 1 hour duration

  const event = {
    summary: title,
    description: description,
    start: {
      dateTime: startDate.toISOString(),
    },
    end: {
      dateTime: endDate.toISOString(),
    },
  };

  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      throw new Error('Failed to add event to Google Calendar. Make sure you granted Calendar access.');
    }
    const data = await response.json();
    return { success: true, link: data.htmlLink };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function createGoogleMeet(title: string, startTime: string) {
  const token = sessionStorage.getItem('google_access_token');
  if (!token) return { success: false, message: 'Google account not fully connected.' };

  const startDate = new Date(startTime);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const event = {
    summary: title,
    start: { dateTime: startDate.toISOString() },
    end: { dateTime: endDate.toISOString() },
    conferenceData: {
      createRequest: {
        requestId: Math.random().toString(36).substring(7),
        conferenceSolutionKey: {
          type: "hangoutsMeet"
        }
      }
    }
  };

  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
       console.error("Calendar API Error:", await response.text());
       throw new Error('Failed to create Google Meet. Make sure you granted Calendar access.');
    }
    const data = await response.json();
    return { 
      success: true, 
      meetLink: data.hangoutLink, 
      eventLink: data.htmlLink 
    };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
