export default function Galery() {
  const categorias = [
    { nome: "NBA", descricao: "Jerseys de basquete americano", cor: "bg-red-500" },
    { nome: "NFL", descricao: "Jerseys de futebol americano", cor: "bg-blue-500" },
    { nome: "NHL", descricao: "Jerseys de hockey", cor: "bg-green-500" },
    { nome: "MLS", descricao: "Jerseys de futebol americano", cor: "bg-purple-500" }
  ];

  return (
    <section className="py-12 bg-gray-100">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-primary mb-8">
          Categorias
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categorias.map((categoria, index) => (
            <div key={index} className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className={`${categoria.cor} h-32 flex items-center justify-center`}>
                <span className="text-white font-bold text-2xl">{categoria.nome}</span>
              </div>
              <div className="p-6">
                <h3 className="font-semibold text-lg mb-2">{categoria.nome}</h3>
                <p className="text-gray-600">{categoria.descricao}</p>
                <button className="mt-4 w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark transition-colors">
                  Ver Produtos
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}