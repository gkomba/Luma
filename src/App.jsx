import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Adicione outras rotas aqui */}
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
