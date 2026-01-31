import { NextRequest, NextResponse } from 'next/server';

const APP_ID = '710949215288618';
const APP_SECRET = 'f40a24a71b8aac42288955753d90fbd5';
const APP_TOKEN = '710949215288618|-g7vhONpNNkkW9IA04kLRJUxRmM';

// Hardcoded Facebook posts for Forsyth County Schools (FCSchools)
const hardcodedPosts = [
  {
    id: '1234567890123456_7890123456789012',
    created_time: '2025-01-31T14:30:00Z',
    message: '📚 Important Update: All Forsyth County Schools will operate on a regular schedule tomorrow, February 1st. Buses will run on normal routes. Please ensure students are ready for a full day of learning! #FCS #ForsythCountySchools',
    full_picture: 'https://scontent.xx.fbcdn.net/v/t39.30808-6/460000000_1234567890123456_1234567890123456789_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=5f2048&_nc_ohc=abc123def456AX9abcdef&_nc_ht=scontent.xx&oh=00_AfB1234567890abcdef1234567890abcdef1234567890&oe=65ABCDEF',
    permalink_url: 'https://www.facebook.com/FCSchools/posts/1234567890123456',
    likes: { summary: { total_count: 234 } },
    comments: { summary: { total_count: 42 } },
    shares: { count: 18 }
  },
  {
    id: '9876543210987654_3210987654321098',
    created_time: '2025-01-30T16:45:00Z',
    message: '🎉 Congratulations to our Forsyth Central High School Bulldogs basketball team on their victory last night! Final score: 78-72. Great teamwork and sportsmanship displayed by all players! � #GoBulldogs #FCSAthletics',
    full_picture: 'https://scontent.xx.fbcdn.net/v/t39.30808-6/460000000_9876543210987654_9876543210987654321_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=5f2048&_nc_ohc=def456ghi789AX9ghidef&_nc_ht=scontent.xx&oh=00_AfB9876543210987654def9876543210987654321&oe=65FEDCBA',
    permalink_url: 'https://www.facebook.com/FCSchools/posts/9876543210987654',
    likes: { summary: { total_count: 456 } },
    comments: { summary: { total_count: 67 } },
    shares: { count: 29 }
  }
];

export async function GET(request: NextRequest) {
  try {
    // Return hardcoded posts
    const formattedPosts = hardcodedPosts.map(post => ({
      id: post.id,
      message: post.message,
      created_time: post.created_time,
      full_picture: post.full_picture,
      permalink_url: post.permalink_url,
      likes_count: post.likes.summary.total_count,
      comments_count: post.comments.summary.total_count,
      shares_count: post.shares.count
    }));

    return NextResponse.json({
      success: true,
      data: formattedPosts
    });

  } catch (error) {
    console.error('Error fetching Facebook posts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch Facebook posts',
        data: hardcodedPosts.slice(0, 2).map(post => ({
          id: post.id,
          message: post.message,
          created_time: post.created_time,
          full_picture: post.full_picture,
          permalink_url: post.permalink_url,
          likes_count: post.likes.summary.total_count,
          comments_count: post.comments.summary.total_count,
          shares_count: post.shares.count
        }))
      },
      { status: 500 }
    );
  }
}
