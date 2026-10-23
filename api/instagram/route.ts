import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // You need to get these from Instagram Basic Display API
    const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID;
    const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
    
    if (!INSTAGRAM_ACCESS_TOKEN) {
      return NextResponse.json({ 
        error: 'Instagram API not configured',
        posts: []
      });
    }

    // Instagram Graph API endpoint
    const response = await fetch(
      `https://graph.instagram.com/${INSTAGRAM_USER_ID}/media?fields=id,caption,media_url,media_type,permalink,thumbnail_url,timestamp&access_token=${INSTAGRAM_ACCESS_TOKEN}&limit=6`
    );

    if (!response.ok) {
      throw new Error('Instagram API failed');
    }

    const data = await response.json();
    
    return NextResponse.json({
      posts: data.data || []
    });
    
  } catch (error) {
    console.error('Instagram API error:', error);
    
    // Fallback: Scrape Instagram page (requires proxy)
    try {
      const fallbackResponse = await fetch(
        `https://www.instagram.com/lacannellecatering/`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      );
      
      const html = await fallbackResponse.text();
      
      // Extract JSON data from Instagram page
      const jsonMatch = html.match(/window\._sharedData\s*=\s*({.+?});/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[1]);
        const posts = jsonData?.entry_data?.ProfilePage?.[0]?.graphql?.user?.edge_owner_to_timeline_media?.edges || [];
        
        const formattedPosts = posts.map((edge: any, index: number) => ({
          id: `fallback-${index}`,
          media_url: edge.node.display_url,
          caption: edge.node.edge_media_to_caption?.edges[0]?.node?.text || '',
          permalink: `https://www.instagram.com/p/${edge.node.shortcode}/`,
          timestamp: edge.node.taken_at_timestamp
        }));
        
        return NextResponse.json({ posts: formattedPosts });
      }
    } catch (scrapeError) {
      console.error('Instagram scrape failed:', scrapeError);
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch Instagram posts',
      posts: []
    });
  }
}