import { useGetCallerProgress } from '../hooks/useQueries';
import { Card, CardContent } from './ui/card';
import { Trophy, Target, Flame, Award } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

export default function UserStats() {
  const { data: progress, isLoading, error } = useGetCallerProgress();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8 p-4 bg-muted rounded-lg text-center">
        <p className="text-sm text-muted-foreground">Unable to load stats. Your progress is still being tracked.</p>
      </div>
    );
  }

  const accuracy = progress && Number(progress.totalAnswered) > 0
    ? Math.round((Number(progress.totalCorrect) / Number(progress.totalAnswered)) * 100)
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8" />
            <div>
              <p className="text-sm opacity-90">Total Correct</p>
              <p className="text-2xl font-bold">{progress ? Number(progress.totalCorrect) : 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8" />
            <div>
              <p className="text-sm opacity-90">Accuracy</p>
              <p className="text-2xl font-bold">{accuracy}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Flame className="w-8 h-8" />
            <div>
              <p className="text-sm opacity-90">Streak</p>
              <p className="text-2xl font-bold">{progress ? Number(progress.streak) : 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8" />
            <div>
              <p className="text-sm opacity-90">Badges</p>
              <p className="text-2xl font-bold">{progress?.badges?.length || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
