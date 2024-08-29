import { h, render } from 'preact';
import { useState, useEffect, useMemo } from 'preact/hooks';
import DATA from '../final.json' with { type: "json" };

interface Episode {
  id: string;
  title: string;
  published: string;
  band: string;
}

function StatsPage({ episodes }: { episodes: Episode[] }) {
  const stats = useMemo(() => {
    const bandMentions = episodes.reduce((acc, episode) => {
      if (episode.band && !episode.band.includes("<") && !episode.band.includes(">")) {
        acc[episode.band] = (acc[episode.band] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const sortedBands = Object.entries(bandMentions).sort((a, b) => b[1] - a[1]);
    const mostMentionedBand = sortedBands[0];
    const leastMentionedBand = sortedBands[sortedBands.length - 1];

    const newBandCount = sortedBands.filter(([, count]) => count === 1).length;
    const newBandPercentage = (newBandCount / sortedBands.length) * 100;

    const lastMentionedBand = episodes.find(episode => episode.band && !episode.band.includes("<") && !episode.band.includes(">"));

    return {
      mostMentionedBand,
      leastMentionedBand,
      newBandPercentage,
      lastMentionedBand
    };
  }, [episodes]);

  return (
    <div class="space-y-6 overflow-y-auto max-h-[calc(100vh-250px)]">
      <div class="flex flex-col items-center bg-white p-6 rounded-lg shadow-md">
        <h3 class="font-semibold text-xl text-indigo-700 mb-3">Fun Stats</h3>
        <ul class="space-y-3">
          <li>Most mentioned band: {stats.mostMentionedBand[0]} ({stats.mostMentionedBand[1]} times)</li>
          <li>Least mentioned band: {stats.leastMentionedBand[0]} ({stats.leastMentionedBand[1]} time)</li>
          <li>DK mentions a new band {stats.newBandPercentage.toFixed(2)}% of the time</li>
          <li>The last mentioned band was {stats.lastMentionedBand?.band} on {new Date(stats.lastMentionedBand?.published || '').toLocaleDateString()}</li>
        </ul>
      </div>
    </div>
  );
}

export default function App() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'band' | 'count' | 'date'>('date');
  const [activeTab, setActiveTab] = useState<'tracker' | 'stats'>('tracker');

  useEffect(() => {
    // Sort episodes by date (most recent first) before setting state
    const sortedEpisodes = [...DATA].sort((a, b) => 
      new Date(b.published).getTime() - new Date(a.published).getTime()
    );
    setEpisodes(sortedEpisodes);
  }, []);

  const filteredEpisodes = episodes.filter(episode =>
    episode.band.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const bandCounts = episodes.reduce((acc, episode) => {
    if (!episode.band || episode.band === "" || episode.band.includes("<") || episode.band.includes(">")) {
      return acc;
    }
    acc[episode.band] = (acc[episode.band] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalCountableEpisodes = episodes.filter(episode => 
    !(episode.band.includes("<") || episode.band.includes(">"))
  ).length;

  const sortedBands = Object.entries(bandCounts).sort((a, b) =>
    sortBy === 'count' ? b[1] - a[1] : 
    sortBy === 'date' ? 0 : // 'date' sorting is handled in filteredEpisodes
    a[0].localeCompare(b[0])
  );

  const knownBandsPercentage = (Object.keys(bandCounts).length / totalCountableEpisodes) * 100;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const tweetMissingInfo = (episodeTitle: string) => {
    const tweetText = encodeURIComponent(`Hey @domtheporcupine, the podcast episode "${episodeTitle}" is missing band information. Can you help fill it in?`);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
  };

  return (
    <div class="container mx-auto p-4 max-w-3xl">
      <h1 class="text-3xl font-bold mb-6 text-center text-indigo-600">Thank U DK Tracker</h1>
      <p class="text-center">A fun little site dedicated to DK's hard work naming random bands!</p>
      <div class="mb-6 flex justify-center space-x-4">
        <button
          onClick={() => setActiveTab('tracker')}
          class={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150 ${
            activeTab === 'tracker' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Band Tracker
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          class={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150 ${
            activeTab === 'stats' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Fun Stats
        </button>
      </div>
      
      {activeTab === 'stats' && <StatsPage episodes={episodes} />}
      {activeTab === 'tracker' && (
        <>
          <div class="mb-6">
            <input
              type="text"
              placeholder="Search bands..."
              value={searchTerm}
              onInput={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
              class="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div class="mb-6 flex justify-center space-x-4">
            {['date', 'band', 'count'].map((sort) => (
              <button
                key={sort}
                onClick={() => setSortBy(sort as 'band' | 'count' | 'date')}
                class={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150 ${
                  sortBy === sort 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Sort by {sort.charAt(0).toUpperCase() + sort.slice(1)}
              </button>
            ))}
          </div>

          <div class="mb-6">
            <div class="w-full bg-gray-200 rounded-full h-4">
              <div
                class="bg-indigo-600 h-4 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${knownBandsPercentage}%` }}
              ></div>
            </div>
            <p class="text-sm mt-2 text-center text-gray-600">Known Bands: {knownBandsPercentage.toFixed(2)}%</p>
          </div>

          <ul class="space-y-4">
            {(sortBy === 'date' ? filteredEpisodes : sortedBands).map((item) => {
              if (sortBy === 'date') {
                const episode = item as Episode;
                return (
                  <li key={episode.id} class="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                    <h3 class="font-semibold text-lg text-indigo-700">{episode.title}</h3>
                    <p class="text-gray-600 text-sm mb-2">Aired: {formatDate(episode.published)}</p>
                    {episode.band && !episode.band.includes("<") && !episode.band.includes(">") ? (
                      <p class="text-gray-800">Band: {episode.band}</p>
                    ) : (
                      <div>
                        <p class="text-red-500">Missing band information</p>
                        <button
                          onClick={() => tweetMissingInfo(episode.title)}
                          class="mt-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm hover:bg-blue-600 transition-colors duration-150"
                        >
                          Wrong? just @ me bro
                        </button>
                      </div>
                    )}
                  </li>
                );
              } else {
                const [band, count] = item as [string, number];
                return (
                  <li key={band} class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                    <h3 class="font-semibold text-xl text-indigo-700 mb-3">{band}</h3>
                    <p class="text-gray-600 mb-4">{episodes.length} {episodes.length === 1 ? 'mention' : 'mentions'}</p>
                    <ul class="space-y-3">
                      {filteredEpisodes.map(episode => (
                        <li key={episode.id} class="border-t pt-3 first:border-t-0 first:pt-0">
                          <h4 class="font-medium text-gray-800">{episode.title}</h4>
                          <p class="text-gray-600 text-sm">Aired: {formatDate(episode.published)}</p>
                          {band === "Unknown" && (
                            <button
                              onClick={() => tweetMissingInfo(episode.title)}
                              class="mt-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm hover:bg-blue-600 transition-colors duration-150"
                            >
                              Tweet @domtheporcupine
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              }
            })}
          </ul>
        </>
      )}
    </div>
  );
}
