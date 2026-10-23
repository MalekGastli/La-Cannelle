import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Use Instagram's media endpoint
    const posts = [
      {
        id: 'C9EjVh_LR9q',
        media_url: `https://www.instagram.com/p/C9EjVh_LR9q/media/?size=l&${Date.now()}`,
        caption: 'Delicious canapés from our catering events! 🍤',
        permalink: 'https://www.instagram.com/p/C9EjVh_LR9q/',
        timestamp: Date.now() / 1000
      },
      {
        id: 'C8FgXk_MP5q',
        media_url: `https://www.instagram.com/p/C8FgXk_MP5q/media/?size=l&${Date.now()}`,
        caption: 'Artisan desserts for special occasions! 🍰',
        permalink: 'https://www.instagram.com/p/C8FgXk_MP5q/',
        timestamp: Date.now() / 1000 - 86400
      },
      {
        id: 'C7DcYj_NQ4p',
        media_url: `https://www.instagram.com/p/C7DcYj_NQ4p/media/?size=l&${Date.now()}`,
        caption: 'Elegant event setup for corporate gala ✨',
        permalink: 'https://www.instagram.com/p/C7DcYj_NQ4p/',
        timestamp: Date.now() / 1000 - 172800
      },
      {
        id: 'C6AbXi_LR3o',
        media_url: `https://www.instagram.com/p/C6AbXi_LR3o/media/?size=l&${Date.now()}`,
        caption: 'Wedding catering with personal touch 💍',
        permalink: 'https://www.instagram.com/p/C6AbXi_LR3o/',
        timestamp: Date.now() / 1000 - 259200
      },
      {
        id: 'C5ZaWh_KP2n',
        media_url: `https://www.instagram.com/p/C5ZaWh_KP2n/media/?size=l&${Date.now()}`,
        caption: 'Corporate event with international cuisine 🌍',
        permalink: 'https://www.instagram.com/p/C5ZaWh_KP2n/',
        timestamp: Date.now() / 1000 - 345600
      },
      {
        id: 'C4Y9Vg_JQ1m',
        media_url: `https://www.instagram.com/p/C4Y9Vg_JQ1m/media/?size=l&${Date.now()}`,
        caption: 'Our signature dish - always a crowd favorite! 👨‍🍳',
        permalink: 'https://www.instagram.com/p/C4Y9Vg_JQ1m/',
        timestamp: Date.now() / 1000 - 432000
      }
    ];

    return NextResponse.json({ posts });
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to fetch Instagram',
      posts: []
    });
  }
}