import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import ScrollManager from "./components/ScrollManager";
import SiteLayout from "./components/SiteLayout";

// Lazy load pages to split the JavaScript bundle
const HomePage = lazy(() => import("./pages/HomePage"));
const GalleryPage = lazy(() => import("./pages/GalleryPage"));
const ImpressumPage = lazy(() => import("./pages/ImpressumPage"));
const ThanksPage = lazy(() => import("./pages/ThanksPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function App() {
  return (
    <>
      <ScrollManager />
      <Suspense fallback={null}>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<HomePage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/impressum" element={<ImpressumPage />} />
            <Route path="/thanks" element={<ThanksPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
