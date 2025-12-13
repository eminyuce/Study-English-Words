import { ArrowLeft, TrendingUp, Users, Target, Zap, Trophy, Flame } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';
import { useGetAnalyticsData } from '../hooks/useQueries';

interface AnalyticsPageProps {
  onBack: () => void;
}

export default function AnalyticsPage({ onBack }: AnalyticsPageProps) {
  const { data: analytics, isLoading, error } = useGetAnalyticsData();

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <Button onClick={onBack} variant="ghost" className="mb-6 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load analytics data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Button onClick={onBack} variant="ghost" className="mb-2 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your progress and explore global insights
          </p>
        </div>
      </div>

      {/* Your Progress Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-purple-600" />
          Your Progress
        </h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : analytics?.personal ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Total Games
                </CardDescription>
                <CardTitle className="text-3xl">{Number(analytics.personal.totalGames)}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Accuracy
                </CardDescription>
                <CardTitle className="text-3xl">
                  {(analytics.personal.accuracy * 100).toFixed(1)}%
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Flame className="w-4 h-4" />
                  Current Streak
                </CardDescription>
                <CardTitle className="text-3xl">{Number(analytics.personal.streak)}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 border-pink-200 dark:border-pink-800">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Total XP
                </CardDescription>
                <CardTitle className="text-3xl">{Number(analytics.personal.xp)}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                Start playing games to see your personal statistics!
              </p>
            </CardContent>
          </Card>
        )}

        {analytics?.personal?.mostPlayedGameMode && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Most Played Game Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-purple-600">
                  {analytics.personal.mostPlayedGameMode || 'None yet'}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Global Insights Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          Global Insights
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : analytics?.global ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Users</CardDescription>
                <CardTitle className="text-3xl">{Number(analytics.global.totalUsers)}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Sessions</CardDescription>
                <CardTitle className="text-3xl">{Number(analytics.global.totalSessions)}</CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Questions Answered</CardDescription>
                <CardTitle className="text-3xl">
                  {Number(analytics.global.totalQuestionsAnswered).toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Average Accuracy</CardDescription>
                <CardTitle className="text-3xl">
                  {(analytics.global.averageAccuracy * 100).toFixed(1)}%
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                No global data available yet.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Game Mode Performance */}
      {analytics?.gameMode && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Game Mode Performance</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Most Played Modes</CardTitle>
                <CardDescription>Number of games played per mode</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.gameMode.gameModePlays.length > 0 ? (
                  analytics.gameMode.gameModePlays.map(([mode, plays]) => (
                    <div key={mode} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{mode}</span>
                        <span className="text-muted-foreground">{Number(plays)} plays</span>
                      </div>
                      <Progress value={Number(plays) > 0 ? 50 : 0} className="h-2" />
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No game data available yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Accuracy by Mode</CardTitle>
                <CardDescription>Performance across different game types</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.gameMode.averageAccuracy.length > 0 ? (
                  analytics.gameMode.averageAccuracy.map(([mode, accuracy]) => (
                    <div key={mode} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{mode}</span>
                        <span className="text-muted-foreground">
                          {(accuracy * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={accuracy * 100} className="h-2" />
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No accuracy data available yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Language Usage */}
      {analytics?.language && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Language Usage</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Words Attempted</CardTitle>
                <CardDescription>Practice activity per language</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.language.wordsAttempted.length > 0 ? (
                  analytics.language.wordsAttempted.map(([language, count]) => (
                    <div key={language} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{language}</span>
                        <span className="text-muted-foreground">{Number(count)} words</span>
                      </div>
                      <Progress value={Number(count) > 0 ? 40 : 0} className="h-2" />
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No language data available yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Games Played by Language</CardTitle>
                <CardDescription>Game sessions per language</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.language.gamesPlayed.length > 0 ? (
                  analytics.language.gamesPlayed.map(([language, count]) => (
                    <div key={language} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{language}</span>
                        <span className="text-muted-foreground">{Number(count)} games</span>
                      </div>
                      <Progress value={Number(count) > 0 ? 40 : 0} className="h-2" />
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No game data available yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}
