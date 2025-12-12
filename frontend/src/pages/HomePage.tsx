import UserStats from '../components/UserStats';
import LanguageGrid from '../components/LanguageGrid';
import AdminPanel from '../components/Admin/AdminPanel';

interface HomePageProps {
  onSelectLanguage: (language: string) => void;
}

export default function HomePage({ onSelectLanguage }: HomePageProps) {
  return (
    <>
      <UserStats />
      <LanguageGrid onSelectLanguage={onSelectLanguage} />
      <AdminPanel />
    </>
  );
}
