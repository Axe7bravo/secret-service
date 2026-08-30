import { StrictMode } from 'react'; import { createRoot } from 'react-dom/client'; import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { APP_NAMES } from '@secret-service/config'; import { AppPlaceholder } from '@secret-service/ui';
function App(){return <Routes><Route path="*" element={<AppPlaceholder eyebrow="INTERNAL OPERATIONS" title={APP_NAMES.admin}>Foundation ready. Administrative features and authentication are intentionally reserved for a later milestone.</AppPlaceholder>}/></Routes>}
createRoot(document.getElementById('root')!).render(<StrictMode><BrowserRouter><App/></BrowserRouter></StrictMode>);
