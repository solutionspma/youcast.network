import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface CommunityGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  member_count: number;
  is_featured: boolean;
  cover_image: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  timeline_image: string | null;
  rules: string | null;
  created_at: string;
}

interface CommunityPost {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: { display_name: string; avatar_url: string | null };
}

// Static community data for initial launch
const staticCommunities: Record<string, CommunityGroup> = {
  'creator-lounge': {
    id: 'c1',
    name: 'Creator Lounge',
    slug: 'creator-lounge',
    description: 'The central hub for all YouCast creators. Share your wins, ask questions, find collaborators, and connect with fellow content creators building their media empires.',
    category: 'general',
    member_count: 4200,
    is_featured: true,
    cover_image: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
    logo_url: null,
    primary_color: '#FF6B35',
    secondary_color: '#1a1a1a',
    accent_color: '#10B981',
    timeline_image: null,
    rules: '1. Be respectful and supportive\n2. No spam or self-promotion without value\n3. Share knowledge freely\n4. Keep discussions on-topic\n5. Credit others when sharing their content',
    created_at: '2024-01-01T00:00:00Z',
  },
  'stream-tech': {
    id: 'c2',
    name: 'Stream Tech',
    slug: 'stream-tech',
    description: 'Technical discussions for streaming professionals. Dive deep into encoding settings, multi-camera setups, audio optimization, OBS configurations, and production workflows.',
    category: 'tech',
    member_count: 1800,
    is_featured: true,
    cover_image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
    logo_url: null,
    primary_color: '#6366F1',
    secondary_color: '#1a1a1a',
    accent_color: '#22D3EE',
    timeline_image: null,
    rules: '1. Provide detailed context when asking questions\n2. Share your specs and settings\n3. Test before recommending solutions\n4. No pirated software discussions\n5. Tag posts with relevant topics',
    created_at: '2024-01-15T00:00:00Z',
  },
  'church-media': {
    id: 'c3',
    name: 'Church Media',
    slug: 'church-media',
    description: 'A dedicated space for church media teams sharing best practices for worship broadcasts, sermon recordings, multi-site streaming, and volunteer training.',
    category: 'industry',
    member_count: 2100,
    is_featured: true,
    cover_image: 'https://images.pexels.com/photos/2774566/pexels-photo-2774566.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
    logo_url: null,
    primary_color: '#8B5CF6',
    secondary_color: '#1a1a1a',
    accent_color: '#F59E0B',
    timeline_image: null,
    rules: '1. Respect all denominations and beliefs\n2. Focus on technical and practical discussions\n3. Share resources generously\n4. Support volunteer-run teams\n5. No vendor solicitation without approval',
    created_at: '2024-02-01T00:00:00Z',
  },
  'podcast-network': {
    id: 'c4',
    name: 'Podcast Network',
    slug: 'podcast-network',
    description: 'Audio creators discussing recording techniques, editing workflows, distribution strategies, RSS optimization, and audience growth tactics for podcasters.',
    category: 'industry',
    member_count: 1500,
    is_featured: true,
    cover_image: 'https://images.pexels.com/photos/3783471/pexels-photo-3783471.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
    logo_url: null,
    primary_color: '#EC4899',
    secondary_color: '#1a1a1a',
    accent_color: '#14B8A6',
    timeline_image: null,
    rules: '1. Share your podcast when contributing value\n2. Provide actionable feedback on posts\n3. Support fellow podcasters\n4. No paid promotion without disclosure\n5. Keep critiques constructive',
    created_at: '2024-02-15T00:00:00Z',
  },
  'growth-marketing': {
    id: 'c5',
    name: 'Growth & Marketing',
    slug: 'growth-marketing',
    description: 'Strategies for audience growth, SEO optimization, social media marketing, email campaigns, and cross-promotion. Learn from creators who have scaled their channels.',
    category: 'marketing',
    member_count: 3300,
    is_featured: true,
    cover_image: 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
    logo_url: null,
    primary_color: '#10B981',
    secondary_color: '#1a1a1a',
    accent_color: '#F97316',
    timeline_image: null,
    rules: '1. Share data when discussing results\n2. No get-rich-quick schemes\n3. Disclose affiliates and sponsorships\n4. Focus on sustainable growth\n5. Test strategies before recommending',
    created_at: '2024-03-01T00:00:00Z',
  },
  'sports-media': {
    id: 'c6',
    name: 'Sports Media',
    slug: 'sports-media',
    description: 'For sports broadcasters, commentators, and teams. Discuss live event streaming, instant replay systems, multi-angle production, and sports-specific workflows.',
    category: 'industry',
    member_count: 980,
    is_featured: true,
    cover_image: 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
    logo_url: null,
    primary_color: '#EF4444',
    secondary_color: '#1a1a1a',
    accent_color: '#3B82F6',
    timeline_image: null,
    rules: '1. Respect broadcast rights discussions\n2. Share setup details for live events\n3. Discuss challenges openly\n4. Help with remote production setups\n5. Tag sport type in posts',
    created_at: '2024-03-15T00:00:00Z',
  },
  'education-creators': {
    id: 'c7',
    name: 'Education Creators',
    slug: 'education-creators',
    description: 'Teachers, trainers, and educators creating video content. Discuss course creation, LMS integrations, student engagement, and educational content strategies.',
    category: 'industry',
    member_count: 1250,
    is_featured: true,
    cover_image: 'https://images.pexels.com/photos/4145153/pexels-photo-4145153.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
    logo_url: null,
    primary_color: '#0EA5E9',
    secondary_color: '#1a1a1a',
    accent_color: '#A855F7',
    timeline_image: null,
    rules: '1. Share teaching techniques freely\n2. Respect student privacy in examples\n3. Discuss accessibility considerations\n4. Support all education levels\n5. No course promotion without engagement',
    created_at: '2024-04-01T00:00:00Z',
  },
  'music-live': {
    id: 'c8',
    name: 'Music & Live Performance',
    slug: 'music-live',
    description: 'Musicians and live performers streaming concerts, sessions, and music content. Audio optimization, virtual concerts, merch integration, and fan engagement.',
    category: 'industry',
    member_count: 890,
    is_featured: true,
    cover_image: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
    logo_url: null,
    primary_color: '#D946EF',
    secondary_color: '#1a1a1a',
    accent_color: '#FBBF24',
    timeline_image: null,
    rules: '1. Credit collaborators and samples\n2. Share audio chain details\n3. Discuss licensing openly\n4. Support independent artists\n5. No unauthorized recordings',
    created_at: '2024-04-15T00:00:00Z',
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const community = staticCommunities[slug];
  
  if (!community) {
    return { title: 'Community Not Found | YouCast' };
  }
  
  return {
    title: `${community.name} | YouCast Community`,
    description: community.description || `Join the ${community.name} community on YouCast`,
  };
}

export default async function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;
  
  // Try to fetch from database first
  let community: CommunityGroup | null = null;
  const { data: dbCommunity } = await supabase
    .from('community_groups')
    .select('*')
    .eq('slug', slug)
    .single();
  
  if (dbCommunity) {
    community = dbCommunity;
  } else if (staticCommunities[slug]) {
    community = staticCommunities[slug];
  }
  
  if (!community) {
    notFound();
  }
  
  // Fetch recent posts
  let posts: CommunityPost[] = [];
  if (dbCommunity) {
    const { data: postsData } = await supabase
      .from('community_posts')
      .select('id, content, created_at, user_id, profiles(display_name, avatar_url)')
      .eq('group_id', community.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (postsData) {
      posts = postsData as unknown as CommunityPost[];
    }
  }
  
  // Check if user is a member
  let isMember = false;
  if (user && dbCommunity) {
    const { data: membership } = await supabase
      .from('group_memberships')
      .select('id')
      .eq('group_id', community.id)
      .eq('user_id', user.id)
      .single();
    
    isMember = !!membership;
  }
  
  const primaryColor = community.primary_color || '#FF6B35';
  const rulesArray = community.rules?.split('\n').filter(r => r.trim()) || [];
  
  return (
    <div className="min-h-screen bg-surface-950">
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 lg:h-96">
        {community.cover_image ? (
          <img
            src={community.cover_image}
            alt={community.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full"
            style={{ backgroundColor: primaryColor }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/50 to-transparent" />
      </div>
      
      {/* Community Header */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-8">
          {/* Logo */}
          <div 
            className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-surface-950 flex items-center justify-center text-white text-4xl font-bold shadow-xl"
            style={{ backgroundColor: primaryColor }}
          >
            {community.logo_url ? (
              <img src={community.logo_url} alt={community.name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              community.name.charAt(0)
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span 
                className="px-3 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {community.category.charAt(0).toUpperCase() + community.category.slice(1)}
              </span>
              {community.is_featured && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-accent-amber/20 text-accent-amber">
                  Featured
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
              {community.name}
            </h1>
            <p className="text-surface-400 text-lg max-w-2xl">
              {community.description}
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{community.member_count.toLocaleString()}</div>
              <div className="text-sm text-surface-500">members</div>
            </div>
            {isLoggedIn ? (
              isMember ? (
                <button className="px-6 py-3 rounded-xl bg-surface-700 text-white font-medium hover:bg-surface-600 transition-colors">
                  Joined
                </button>
              ) : (
                <button 
                  className="px-6 py-3 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: primaryColor }}
                >
                  Join Community
                </button>
              )
            ) : (
              <Link 
                href="/auth/login"
                className="px-6 py-3 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: primaryColor }}
              >
                Sign in to Join
              </Link>
            )}
          </div>
        </div>
        
        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
          {/* Main Content - Posts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Post Input (logged in only) */}
            {isLoggedIn && isMember && (
              <div className="bg-surface-900/50 rounded-2xl border border-surface-800/50 p-6">
                <textarea
                  placeholder="Share something with the community..."
                  className="w-full bg-surface-800/50 border border-surface-700/50 rounded-xl p-4 text-white placeholder-surface-500 resize-none focus:outline-none focus:border-surface-600"
                  rows={3}
                />
                <div className="flex justify-end mt-4">
                  <button 
                    className="px-6 py-2 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Post
                  </button>
                </div>
              </div>
            )}
            
            {/* Activity Feed */}
            <div className="bg-surface-900/50 rounded-2xl border border-surface-800/50">
              <div className="p-6 border-b border-surface-800/50">
                <h2 className="text-xl font-display font-semibold text-white">Activity</h2>
              </div>
              
              {posts.length > 0 ? (
                <div className="divide-y divide-surface-800/50">
                  {posts.map((post) => (
                    <div key={post.id} className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-surface-700 flex items-center justify-center text-white font-medium">
                          {post.profiles?.avatar_url ? (
                            <img src={post.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            post.profiles?.display_name?.charAt(0) || 'U'
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white">{post.profiles?.display_name || 'Unknown'}</span>
                            <span className="text-sm text-surface-500">
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-surface-300">{post.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-800/50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No posts yet</h3>
                  <p className="text-surface-400 max-w-sm mx-auto">
                    {isLoggedIn 
                      ? 'Be the first to start a conversation in this community!'
                      : 'Sign in and join to see community posts and start discussions.'}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* About */}
            <div className="bg-surface-900/50 rounded-2xl border border-surface-800/50 p-6">
              <h3 className="text-lg font-display font-semibold text-white mb-4">About</h3>
              <p className="text-surface-400 text-sm leading-relaxed">
                {community.description}
              </p>
              <div className="mt-4 pt-4 border-t border-surface-800/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-surface-500">Created</span>
                  <span className="text-surface-300">
                    {new Date(community.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Community Rules */}
            {rulesArray.length > 0 && (
              <div className="bg-surface-900/50 rounded-2xl border border-surface-800/50 p-6">
                <h3 className="text-lg font-display font-semibold text-white mb-4">Community Rules</h3>
                <ol className="space-y-3">
                  {rulesArray.map((rule, index) => {
                    // Remove leading number and punctuation from rule text
                    const ruleText = rule.replace(/^\d+[\.\)]\s*/, '');
                    return (
                      <li key={index} className="flex items-start gap-3 text-sm">
                        <span 
                          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {index + 1}
                        </span>
                        <span className="text-surface-400">{ruleText}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
            
            {/* Related Communities */}
            <div className="bg-surface-900/50 rounded-2xl border border-surface-800/50 p-6">
              <h3 className="text-lg font-display font-semibold text-white mb-4">Related Communities</h3>
              <div className="space-y-3">
                {Object.values(staticCommunities)
                  .filter(c => c.slug !== slug)
                  .slice(0, 4)
                  .map((related) => (
                    <Link
                      key={related.slug}
                      href={`/c/${related.slug}`}
                      className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-surface-800/50 transition-colors"
                    >
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: related.primary_color || '#FF6B35' }}
                      >
                        {related.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">{related.name}</div>
                        <div className="text-xs text-surface-500">{related.member_count.toLocaleString()} members</div>
                      </div>
                    </Link>
                  ))}
              </div>
              <Link
                href="/community"
                className="mt-4 block text-center text-sm font-medium hover:text-white transition-colors"
                style={{ color: primaryColor }}
              >
                View all communities →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
