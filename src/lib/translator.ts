// Dictionary-based translation for common phrases
const commonTranslations: { [key: string]: string } = {
  'hello': 'hola',
  'goodbye': 'adiós',
  'thank you': 'gracias',
  'please': 'por favor',
  'yes': 'sí',
  'no': 'no',
  'help': 'ayuda',
  'stop': 'detener',
  'police': 'policía',
  'ice': 'ICE',
  'warrant': 'orden judicial',
  'lawyer': 'abogado',
  'rights': 'derechos',
  'constitution': 'constitución',
  'amendment': 'enmienda',
  'identification': 'identificación',
  'badge': 'placa',
  'officer': 'oficial',
  'agent': 'agente',
  'immigration': 'inmigración',
  'document': 'documento',
  'signature': 'firma',
  'sign': 'firmar',
  'understand': 'entender',
  'speak': 'hablar',
  'english': 'inglés',
  'spanish': 'español',
  'free to go': 'libre de irme',
  'am i free to go': '¿soy libre de irme?',
  'am i under arrest': '¿estoy bajo arresto?',
  'i do not consent': 'no doy mi consentimiento',
  'i want a lawyer': 'quiero un abogado',
  'i have the right to remain silent': 'tengo derecho a guardar silencio',
  'do you have a warrant': '¿tiene una orden judicial?',
  'show me your badge': 'muéstreme su placa',
  'what is your badge number': '¿cuál es su número de placa?',
  'i do not want to answer questions': 'no quiero responder preguntas',
  'i do not want to sign anything': 'no quiero firmar nada',
  'i need to speak with my lawyer': 'necesito hablar con mi abogado',
  'i do not give permission to enter': 'no doy permiso para entrar',
  'i do not give permission to search': 'no doy permiso para registrar',
  'i have rights': 'tengo derechos',
  'i need an interpreter': 'necesito un intérprete',
  'i do not speak english': 'no hablo inglés',
  'i do not understand': 'no entiendo',
  'i am recording this': 'estoy grabando esto',
  'this is being recorded': 'esto está siendo grabado',
  'i want to make a phone call': 'quiero hacer una llamada telefónica',
  'i need to call my lawyer': 'necesito llamar a mi abogado',
  'i do not authorize': 'no autorizo',
  'i do not agree': 'no estoy de acuerdo',
  'i do not accept': 'no acepto',
  'i refuse': 'me niego',
  'leave': 'váyase',
  'go away': 'váyase',
  'come back with a warrant': 'vuelva con una orden judicial',
  'show me the warrant': 'muéstreme la orden judicial',
  'is this a warrant': '¿es esto una orden judicial?',
  'signed by a judge': 'firmada por un juez',
  'do you have probable cause': '¿tiene causa probable?',
  'what is the probable cause': '¿cuál es la causa probable?',
  'why are you here': '¿por qué está aquí?',
  'why am i being detained': '¿por qué estoy siendo detenido?',
  'am i being detained': '¿estoy siendo detenido?',
  'what department are you from': '¿de qué departamento es usted?',
  'what agency are you from': '¿de qué agencia es usted?',
  'who are you': '¿quién es usted?',
  'what is your name': '¿cuál es su nombre?',
  'i want to speak to your supervisor': 'quiero hablar con su supervisor',
  'call your supervisor': 'llame a su supervisor',
  'get your supervisor': 'traiga a su supervisor',
  'can we check to see if this is recording': 'podemos verificar si esto está grabando',
  'check': 'verificar',
  'recording': 'grabando',
  'this': 'esto',
  'is': 'está',
  'if': 'si',
  'see': 'ver',
  'to': 'para',
  'we': 'nosotros',
  'can': 'podemos'
};

export const initializeTranslator = async () => {
  // No initialization needed for dictionary-based translation
  return Promise.resolve();
};

export const translateText = async (text: string): Promise<string> => {
  const lowerText = text.toLowerCase().trim();
  
  // First try exact match
  if (commonTranslations[lowerText]) {
    return commonTranslations[lowerText];
  }

  // Split into words and try to match phrases
  const words = lowerText.split(' ');
  let translation = '';
  let i = 0;
  
  while (i < words.length) {
    let found = false;
    
    // Try to match phrases of decreasing length
    for (let len = 5; len > 0; len--) {
      if (i + len <= words.length) {
        const phrase = words.slice(i, i + len).join(' ');
        if (commonTranslations[phrase]) {
          translation += (translation ? ' ' : '') + commonTranslations[phrase];
          i += len;
          found = true;
          break;
        }
      }
    }
    
    // If no phrase match found, keep the original word
    if (!found) {
      translation += (translation ? ' ' : '') + words[i];
      i++;
    }
  }
  
  return translation.charAt(0).toUpperCase() + translation.slice(1);
};