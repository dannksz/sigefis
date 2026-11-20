import { toast, ToastOptions } from 'react-toastify';

// Configuração padrão para todas as notificações
const defaultOptions: ToastOptions = {
  position: "bottom-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

// Notificações de Sucesso
export const showSuccess = (message: string) => {
  toast.success(message, {
    ...defaultOptions,
    className: 'toast-success',
  });
};

// Notificações de Erro
export const showError = (message: string) => {
  toast.error(message, {
    ...defaultOptions,
    autoClose: 4000,
    className: 'toast-error',
  });
};

// Notificações de Aviso
export const showWarning = (message: string) => {
  toast.warning(message, {
    ...defaultOptions,
    className: 'toast-warning',
  });
};

// Notificações de Informação
export const showInfo = (message: string) => {
  toast.info(message, {
    ...defaultOptions,
    className: 'toast-info',
  });
};

// Notificações específicas do sistema
export const notifications = {
  // Carrinho
  addedToCart: () => showSuccess('✅ Produto adicionado ao carrinho!'),
  removedFromCart: () => showSuccess('🗑️ Produto removido do carrinho'),
  cartCleared: () => showInfo('🧹 Carrinho limpo'),
  selectSize: () => showWarning('📏 Por favor, selecione um tamanho disponível'),
  loginRequired: () => showWarning('🔒 Você precisa estar logado para adicionar ao carrinho'),
  
  // Autenticação
  loginSuccess: () => showSuccess('👋 Bem-vindo de volta!'),
  loginError: () => showError('❌ Email ou senha inválidos'),
  logoutSuccess: () => showInfo('👋 Até logo!'),
  registerSuccess: () => showSuccess('✅ Cadastro realizado com sucesso!'),
  
  // Pedidos
  orderCreated: () => showSuccess('🎉 Pedido criado com sucesso!'),
  orderError: () => showError('❌ Erro ao criar pedido'),
  paymentSuccess: () => showSuccess('💳 Pagamento aprovado!'),
  paymentError: () => showError('❌ Erro no pagamento'),
  
  // Formulários
  fillAllFields: () => showWarning('📝 Por favor, preencha todos os campos obrigatórios'),
  invalidData: () => showError('❌ Dados inválidos'),
  saveSuccess: () => showSuccess('✅ Salvo com sucesso!'),
  saveError: () => showError('❌ Erro ao salvar'),
  
  // Avaliações
  reviewSuccess: () => showSuccess('⭐ Avaliação enviada com sucesso!'),
  reviewError: () => showError('❌ Erro ao enviar avaliação'),
  
  // Clipboard
  copiedToClipboard: () => showSuccess('📋 Copiado para área de transferência!'),
  
  // Acessibilidade
  librasActivated: () => showInfo('🤟 Funcionalidade de Libras ativada!'),
  
  // Cookies
  cookieSet: () => showSuccess('🍪 Cookie definido!'),
  cookieRemoved: () => showSuccess('🗑️ Cookie removido!'),
  themeSaved: (theme: string) => showSuccess(`🎨 Tema ${theme} salvo!`),
  languageSaved: () => showSuccess('🌐 Idioma salvo!'),
  
  // Genérico
  success: (message: string) => showSuccess(message),
  error: (message: string) => showError(message),
  warning: (message: string) => showWarning(message),
  info: (message: string) => showInfo(message),
};

export default notifications;
