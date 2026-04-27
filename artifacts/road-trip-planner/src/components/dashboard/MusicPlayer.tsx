import { useState } from 'react';
import { useTripStore } from '@/store/use-trip-store';
import { useGetAiMusicPlaylist, MusicPlaylistRequestMood, MusicPlaylistRequestRouteType } from '@workspace/api-client-react';
import { Music, Play, Pause, SkipForward, SkipBack, Share2, Youtube, Loader2, Globe, ListMusic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const LANGUAGES = [
  { code: 'English',    label: 'English',    flag: '🇺🇸' },
  { code: 'Hindi',      label: 'Hindi',      flag: '🇮🇳' },
  { code: 'Spanish',    label: 'Spanish',    flag: '🇪🇸' },
  { code: 'French',     label: 'French',     flag: '🇫🇷' },
  { code: 'Portuguese', label: 'Português',  flag: '🇧🇷' },
  { code: 'Arabic',     label: 'Arabic',     flag: '🇸🇦' },
  { code: 'Korean',     label: '한국어',      flag: '🇰🇷' },
  { code: 'Japanese',   label: '日本語',      flag: '🇯🇵' },
  { code: 'Tamil',      label: 'Tamil',      flag: '🎵' },
  { code: 'Telugu',     label: 'Telugu',     flag: '🎶' },
  { code: 'German',     label: 'Deutsch',    flag: '🇩🇪' },
  { code: 'Italian',    label: 'Italiano',   flag: '🇮🇹' },
  { code: 'Turkish',    label: 'Türkçe',     flag: '🇹🇷' },
  { code: 'Punjabi',    label: 'Punjabi',    flag: '🥁' },
];

const MOOD_EMOJIS: Record<string, string> = {
  energetic:   '⚡',
  relaxed:     '😌',
  adventurous: '🏔️',
  romantic:    '💖',
  focused:     '🎯',
  fun:         '🎉',
};

export function MusicPlayer() {
  const { request, musicPlaylist, setMusicPlaylist } = useTripStore();
  const generatePlaylist = useGetAiMusicPlaylist();

  const [mood, setMood]       = useState<MusicPlaylistRequestMood>(MusicPlaylistRequestMood.energetic);
  const [language, setLanguage] = useState('English');
  const [isPlaying, setIsPlaying]           = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  const handleGenerate = () => {
    generatePlaylist.mutate({
      data: {
        tripRequest: request,
        mood,
        routeType: MusicPlaylistRequestRouteType.balanced,
        language,
      }
    }, {
      onSuccess: (res) => {
        setMusicPlaylist(res);
        setCurrentTrackIndex(0);
        setIsPlaying(false);
      },
      onError: () => {
        toast({ title: 'Failed to generate playlist', description: 'Please try again.', variant: 'destructive' });
      }
    });
  };

  const handleShare = () => {
    if (musicPlaylist) {
      navigator.clipboard.writeText(
        `Check out my road trip playlist: ${musicPlaylist.playlistName}\n${musicPlaylist.playlistDescription}`
      );
      toast({ title: 'Copied to clipboard!' });
    }
  };

  const buildYouTubeMusicPlaylistUrl = () => {
    if (!musicPlaylist) return '#';
    // Build a search query from the top tracks: "Artist1 - Song1, Artist2 - Song2 ..."
    const trackQuery = musicPlaylist.tracks
      .slice(0, 5)
      .map(t => `${t.artist} ${t.title}`)
      .join(' ');
    return `https://music.youtube.com/search?q=${encodeURIComponent(trackQuery)}`;
  };

  const buildYouTubePlaylistSearchUrl = () => {
    if (!musicPlaylist) return '#';
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(
      musicPlaylist.playlistName + ' ' + language + ' road trip playlist'
    )}`;
  };

  const currentTrack = musicPlaylist?.tracks[currentTrackIndex];
  const selectedLang = LANGUAGES.find(l => l.code === language);

  return (
    <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      <div className="p-6 border-b border-border/50">
        <h3 className="text-lg font-bold font-display flex items-center gap-2 mb-5">
          <Music className="w-5 h-5 text-primary" />
          AI Road Trip DJ
        </h3>

        {/* Mood selector */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Mood</p>
          <div className="flex flex-wrap gap-2">
            {Object.values(MusicPlaylistRequestMood).map(m => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border
                  ${mood === m
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted text-muted-foreground border-border'
                  }`}
              >
                <span>{MOOD_EMOJIS[m]}</span>
                <span className="capitalize">{m}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Language selector */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" /> Language
          </p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border
                  ${language === lang.code
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted text-muted-foreground border-border'
                  }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generatePlaylist.isPending}
          className="w-full sm:w-auto hover-elevate"
        >
          {generatePlaylist.isPending
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</>
            : <><Music className="w-4 h-4 mr-2" />Generate {selectedLang?.flag} {language} Playlist</>
          }
        </Button>
      </div>

      {musicPlaylist && (
        <div className="flex flex-col md:flex-row h-full">
          {/* Player Controls */}
          <div className="p-6 bg-muted/20 md:w-1/3 border-b md:border-b-0 md:border-r border-border/50 flex flex-col justify-center items-center text-center">
            {currentTrack ? (
              <>
                <div className="w-32 h-32 bg-primary/10 rounded-2xl mb-6 flex items-center justify-center relative overflow-hidden shadow-inner">
                  <div className={`absolute inset-0 bg-primary/20 ${isPlaying ? 'animate-pulse' : ''}`} />
                  <Music className={`w-12 h-12 text-primary relative z-10 ${isPlaying ? 'animate-bounce' : ''}`} />
                </div>
                <h4 className="font-bold text-lg leading-tight mb-1">{currentTrack.title}</h4>
                <p className="text-muted-foreground text-sm mb-1">{currentTrack.artist}</p>
                <p className="text-xs text-muted-foreground/70 mb-6">{currentTrack.album}</p>

                <div className="flex items-center gap-4 mb-6">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentTrackIndex(Math.max(0, currentTrackIndex - 1))} disabled={currentTrackIndex === 0}>
                    <SkipBack className="w-5 h-5" />
                  </Button>
                  <Button size="icon" className="w-12 h-12 rounded-full hover-elevate" onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setCurrentTrackIndex(Math.min(musicPlaylist.tracks.length - 1, currentTrackIndex + 1))} disabled={currentTrackIndex === musicPlaylist.tracks.length - 1}>
                    <SkipForward className="w-5 h-5" />
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground italic px-4">"{currentTrack.reason}"</p>
              </>
            ) : (
              <div className="text-muted-foreground text-sm">Select a track</div>
            )}
          </div>

          {/* Track List */}
          <div className="flex-1 p-6 max-h-[420px] overflow-y-auto">
            <div className="mb-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-xl font-bold font-display">{musicPlaylist.playlistName}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{musicPlaylist.playlistDescription}</p>
                  <p className="text-xs text-muted-foreground mt-1">{musicPlaylist.tracks.length} tracks · {musicPlaylist.totalDuration}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleShare} title="Copy to clipboard">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Play full playlist buttons */}
              <div className="flex flex-wrap gap-2">
                <a
                  href={buildYouTubeMusicPlaylistUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
                >
                  <Youtube className="w-3.5 h-3.5" />
                  Play on YouTube Music
                </a>
                <a
                  href={buildYouTubePlaylistSearchUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-semibold transition-colors"
                >
                  <ListMusic className="w-3.5 h-3.5" />
                  Search Full Playlist
                </a>
              </div>
            </div>

            <div className="space-y-1.5">
              {musicPlaylist.tracks.map((track, idx) => (
                <div
                  key={idx}
                  onClick={() => { setCurrentTrackIndex(idx); setIsPlaying(true); }}
                  className={`flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer border border-transparent
                    ${currentTrackIndex === idx ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'}`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="text-sm font-medium text-muted-foreground w-4 shrink-0">{idx + 1}</div>
                    <div className="truncate">
                      <div className={`font-semibold text-sm truncate ${currentTrackIndex === idx ? 'text-primary' : 'text-foreground'}`}>
                        {track.title}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{track.artist}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs font-medium px-2 py-0.5 bg-background rounded-md text-muted-foreground border">
                      {track.duration}
                    </span>
                    <a
                      href={`https://youtube.com/results?search_query=${encodeURIComponent(`${track.title} ${track.artist}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                      title="Search on YouTube"
                    >
                      <Youtube className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-border/50 text-xs text-muted-foreground italic">
              {musicPlaylist.aiCurationNote}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
