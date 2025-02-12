import React from 'react';
import { X, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal = ({ isOpen, onClose }: AboutModalProps) => {
  const { language } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1001] overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <style>
          {`
            .CaseLaw_Emphasis {
              font-size: 0.875rem;
              font-style: italic;
              color: rgb(156 163 175);
            }
          `}
        </style>

        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-300"
          >
            <X size={24} />
          </button>

          {/* Content */}
          <div className="p-8 space-y-12">
            {/* About This App */}
            <section>
              <h1 className="text-3xl font-bold text-white mb-4">
                {language === 'es' ? 'Acerca de Esta Aplicación' : 'About This App'}
              </h1>
              <p className="text-gray-300 font-medium text-lg mb-6">
                {language === 'es' 
                  ? <>
                      VÍGIA es una aplicación comunitaria diseñada para ayudar a proteger los derechos de los inmigrantes y proporcionar herramientas para interacciones seguras con las autoridades. La aplicación está destinada a educar a los usuarios sobre sus derechos y responsabilidades y no fomenta la evasión de la ley. El cumplimiento de órdenes legales, como las órdenes judiciales emitidas por un juez, es esencial. <span className="CaseLaw_Emphasis">(Ver NAACP v. Alabama, 1958; Richmond Newspapers, Inc. v. Virginia, 1980)</span>
                    </>
                  : <>
                      VÍGIA is a community-driven application designed to help protect immigrant rights and provide tools for safe interactions with authorities. The app is intended to educate users about their rights and responsibilities and does not encourage evasion of law enforcement. Compliance with lawful orders, such as warrants issued by a judge, is essential. <span className="CaseLaw_Emphasis">(See NAACP v. Alabama, 1958; Richmond Newspapers, Inc. v. Virginia, 1980)</span>
                    </>
                }
              </p>
              <div className="text-center">
                <p className="text-gray-400 mb-2">
                  {language === 'es' 
                    ? '¿Quieres saber más sobre cómo se creó esta aplicación?' 
                    : 'Want to learn more about how this app came to be?'}
                </p>
                <a
                  href="/background-story.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1.5"
                >
                  <span className="underline">
                    {language === 'es' ? 'Lee nuestra historia' : 'Read our story'}
                  </span>
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </section>

            {/* How to Use */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-8">
                {language === 'es' ? 'Cómo Usar' : 'How to Use'}
              </h2>
              
              <div className="space-y-8">
                {/* Map Module */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    {language === 'es' ? 'Módulo de Mapa' : 'Map Module'}
                  </h3>
                  <div className="space-y-4 text-gray-300 font-medium">
                    {language === 'es' ? (
                      <>
                        <p>
                          Al iniciar la aplicación, verás un mapa de tu área. Verás marcadores que mostrarán avistamientos reportados por la comunidad de ICE o fuerzas del orden. Estos marcadores están destinados únicamente a mantener a la comunidad informada sobre la actividad visible de las fuerzas del orden y no fomentan ni facilitan la evasión de las autoridades. <span className="CaseLaw_Emphasis">(Ver Smith v. Cumming, 11th Cir. 2000; Fordyce v. City of Seattle, 9th Cir. 1995)</span> Haz clic en colocar una marca, luego haz clic en el mapa donde los ves. Esto abrirá un cuadro para confirmar si era ICE o policía. Esto colocará una marca que otros usuarios podrán ver.
                        </p>
                        <p>
                          Otros usuarios podrán ver estas marcas cuando inicien sesión en el sitio. Si un usuario hace clic en la marca, puede confirmar si todavía está allí o ha pasado. Esto te permitirá estar informado de lo que está sucediendo en tu área.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>
                          Starting the app, you will be presented with a map of your area. You will see markers that will show community-reported sightings of ICE or law enforcement. These markers are intended solely to keep the community informed about visible law enforcement activity and do not encourage or facilitate evasion of authorities. <span className="CaseLaw_Emphasis">(See Smith v. Cumming, 11th Cir. 2000; Fordyce v. City of Seattle, 9th Cir. 1995)</span> Click on the place a mark, then click on the map where you see them. This will bring up a box to confirm whether this was ICE or police. This will place a mark that other users will be able to see.
                        </p>
                        <p>
                          Other users will be able to see these marks when they log into the site. If a user clicks on the mark, they can confirm if it is still there or has passed. This will allow you to be informed of what is happening in your area.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Encounter Mode */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    {language === 'es' ? 'Modo de Encuentro' : 'Encounter Mode'}
                  </h3>
                  <div className="space-y-4 text-gray-300 font-medium">
                    {language === 'es' ? (
                      <>
                        <p>
                          Imagina que ICE está en tu puerta. Hay cosas a considerar:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                          <li>Si no conoces tus derechos, podrías simplemente abrir la puerta.</li>
                          <li>Si hablas y tienes acento, podrías ser perfilado y seguido más.</li>
                          <li>Tu quinta enmienda establece que no tienes que hablar.</li>
                          <li>No entiendes inglés.</li>
                        </ul>
                        <p>
                          Coloca la aplicación en la puerta y presiona el botón de escuchar. Esto utilizará un sistema de IA para escuchar el habla en inglés y traducir al español en la pantalla para que puedas entender lo que se está diciendo.
                        </p>
                        <p>
                          <strong className="text-yellow-400">Importante:</strong> Aún así no deberías responder. Desafortunadamente, hay casos donde las personas pueden enfrentar suposiciones sesgadas basadas en su acento o idioma. En los Estados Unidos, esto se conoce como Perfilamiento Racial: hacer juicios sobre alguien basado en su apariencia o la forma en que suenan.
                        </p>
                        <p>
                          En lugar de hablar, presiona uno de los botones preestablecidos en la pantalla. Anunciará las siguientes cosas por ti.
                        </p>
                        <p>
                          La Inteligencia Artificial está creando estos mensajes y reproduciéndolos en una voz masculina caucásica neutral para reducir posibles sesgos o suposiciones basadas en el acento o el origen del hablante. Esta función tiene como objetivo promover una comunicación imparcial y evitar malentendidos durante las interacciones con las autoridades.
                        </p>
                        <p>
                          En la parte inferior, hay una sección donde puedes escribir tu propio mensaje en español. Cuando presionas enviar, la Inteligencia Artificial lo traducirá a texto en inglés, lo pasará por otra IA y lo convertirá en una voz caucásica para que otros lo escuchen.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>
                          Imagine if ICE is at your door. There are things to consider:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                          <li>If you don't know your rights, you may just open the door.</li>
                          <li>If you speak, and you have an accent, you may be profiled and followed further.</li>
                          <li>Your Fifth Amendment states you don't have to speak.</li>
                          <li>You don't understand English.</li>
                        </ul>
                        <p>
                          Place the app on the door and press the listen button. This will use an AI system to listen for English speech and translate to Spanish on screen so you can understand what is being said.
                        </p>
                        <p>
                          <strong className="text-yellow-400">Important:</strong> You still should not respond. Unfortunately, there are instances where individuals may face biased assumptions based on their accent or language. In the United States, this is referred to as Racial Profiling—making judgments about someone based on their appearance or the way they sound.
                        </p>
                        <p>
                          Instead of talking, press one of the pre-made buttons on the screen. It will announce the following things for you.
                        </p>
                        <p>
                          Artificial Intelligence is making these messages and rendering them in a neutral, Male Caucasian voice to reduce potential biases or assumptions based on the speaker's accent or background. This feature aims to promote impartial communication and avoid misinterpretation during interactions with authorities.
                        </p>
                        <p>
                          At the bottom, there is a section where you can type your own message in Spanish. When you hit send, Artificial Intelligence will translate it to English text, pass it through another AI, and turn it into a Caucasian voice for those to hear.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Rights Panel */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    {language === 'es' ? 'Panel de Derechos' : 'Rights Panel'}
                  </h3>
                  <div className="space-y-4 text-gray-300 font-medium">
                    {language === 'es' ? (
                      <>
                        <p>
                          Antes de continuar, es importante notar: Si las fuerzas del orden presentan una orden judicial válida y firmada, es tu obligación legal cumplir. Una orden judicial típicamente es emitida por un juez basada en evidencia relacionada con una investigación criminal. No cumplir con una orden judicial legal puede resultar en consecuencias legales adicionales. El propósito de esta aplicación es informar y educar a los usuarios sobre sus derechos, no fomentar la evasión de la ley ni obstruir la justicia.
                        </p>
                        <p>
                          Muchos inmigrantes no conocen las disposiciones de la Constitución y cómo se aplican a ellos. Por ejemplo, hay muchos inmigrantes que creen que la Constitución solo sirve a los ciudadanos americanos. Esto no es cierto. Si tus pies están en suelo americano – la Constitución te protege. <span className="CaseLaw_Emphasis">(Ver Yick Wo v. Hopkins, 1886; Zadvydas v. Davis, 2001)</span> En los Estados Unidos, hay adiciones a la Constitución llamadas Enmiendas. Hay 27 Enmiendas a la Constitución. Las enmiendas 4ª, 5ª y 14ª proporcionan muchas protecciones que deberías conocer.
                        </p>
                        <p>
                          Las dos protecciones más importantes son - No pueden detenerte e interrogarte si no estás haciendo nada malo. La policía tiene que tener una razón para detenerte - lo llaman Causa Probable. No tienes que decirle nada a nadie si no estás haciendo nada malo, excepto en situaciones donde la ley requiere que proporciones identificación, como en estados con estatutos de "parar e identificar". Parecer un inmigrante no es Causa Probable para ser detenido. Eso es Perfilamiento Racial.
                        </p>
                        <p>
                          Si no has hecho nada malo, no debería haber razón para responder ninguna de sus preguntas (5ª Enmienda). En investigaciones criminales, un Juez firmará algo llamado una Orden Judicial, autorizando explícitamente a los oficiales a arrestarte o llevarte bajo custodia. Si no tienen una orden judicial, y si no has hecho nada malo, la policía legalmente no tiene razón para detenerte.
                        </p>
                        <p>
                          Puedes preguntarle al oficial de policía "¿Soy libre de irme?". Decir esta declaración está dentro de tu derecho, e informa a las fuerzas del orden que conoces tus derechos, y estás claramente pidiéndoles que se vayan. Si te retienen de todos modos - eso es una violación de tus derechos, y puede ser llevado a la corte.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>
                          Before proceeding, it's important to note: If law enforcement presents a valid, signed warrant, it is your legal obligation to comply. A warrant is typically issued by a judge based on evidence related to a criminal investigation. Failure to comply with a lawful warrant can result in additional legal consequences. The purpose of this app is to inform and educate users about their rights—not to encourage evasion of law enforcement or obstruct justice.
                        </p>
                        <p>
                          Many immigrants do not know the provisions of the Constitution and how it applies to them. For example, there are many immigrants that believe that the Constitution only serves American citizens. This is not true. If your feet are on American soil – the Constitution protects you. <span className="CaseLaw_Emphasis">(See Yick Wo v. Hopkins, 1886; Zadvydas v. Davis, 2001)</span> In the United States, there are additions to the Constitution called Amendments. There are 27 Amendments to the Constitution. The 4th, 5th, and 14th amendments provide many protections that you should know.
                        </p>
                        <p>
                          The two biggest protections are - You cannot be stopped and questioned if you are not doing anything wrong. The police have to have a reason to stop you - they call this Probable Cause. You do not have to tell anyone anything if you are not doing anything wrong, unless you are in a situation where the law requires you to provide identification, such as in states with "stop and identify" statutes. Looking like an immigrant is not Probable Cause to be stopped. That is Racial Profiling.
                        </p>
                        <p>
                          If you have nothing wrong, there should be no reason to answer any of their questions (5th Amendment). In criminal investigations, a judge will sign something called a Warrant, explicitly authorizing officers to arrest you or take you into custody. If they do not have a warrant, and if you have done nothing wrong, the police legally do not have a reason to detain you.
                        </p>
                        <p>
                          You can ask the police officer "Am I free to go." Saying this statement is within your right and informs law enforcement that you are aware of your rights, and you are clearly asking them to leave. If they keep you anyway - that is a violation of your rights and can be brought to court.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Proof/Registro */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    {language === 'es' ? 'Prueba/Registro' : 'Proof/Registro'}
                  </h3>
                  <div className="space-y-4 text-gray-300 font-medium">
                    {language === 'es' ? (
                      <>
                        <p>
                          En el panel de Prueba/Registro puedes presionar el botón de grabar. Esto encenderá tu micrófono y comenzará a grabar tu conversación.
                        </p>
                        <p>
                          No digas nada y presiona el primer botón. Está bien si el oficial ve esto. La grabación de interacciones con las fuerzas del orden está protegida en espacios públicos bajo la Primera Enmienda, pero ten en cuenta que las leyes estatales sobre el consentimiento para grabar pueden variar. <span className="CaseLaw_Emphasis">(Ver Glik v. Cunniffe, 2011; Fordyce v. City of Seattle, 1995)</span>
                        </p>
                        <p>
                          El primer botón anuncia un mensaje diciendo que esta conversación está siendo grabada para tus registros.
                        </p>
                        <p>
                          El segundo botón informa al oficial que tus derechos bajo la Constitución de EE.UU. te informan que no tienes que responder nada si no has hecho algo malo.
                        </p>
                        <p>
                          El tercer botón pregunta si pueden proporcionar su identificación – un número de placa. Esto es importante para tus registros ya que te permite saber quiénes son.
                        </p>
                        <p>
                          El cuarto botón pregunta si eres libre de irte.
                        </p>
                        <p>
                          Estos botones tienen un "sí o no" al final de cada oración para asegurarse de que el oficial sepa que debe decir sí o no.
                        </p>
                        <p>
                          Antes de terminar, presiona el botón de despedida. Esto informa al oficial que has guardado esto para tus registros y les desea un buen día.
                        </p>
                        <p>
                          Una vez completado, la interacción aparece en tus grabaciones guardadas de interacciones. Puedes escucharlas, o copiarlas para enviarlas a alguien más para mantener en los registros. La interacción también registra la fecha/hora y tu coordenada GPS de donde estabas cuando grabaste esto. Te recomendaría que si esto te sucede, deberías presionar copiar inmediatamente y enviar esto a quien quieras que tenga otra prueba de este registro.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>
                          In the Proof/Registro panel, you can press the record button. This will turn on your microphone and start recording your conversation.
                        </p>
                        <p>
                          Do not say anything and press the first button. It is OK if the officer sees this. Recording law enforcement interactions is protected in public spaces under the First Amendment, but be aware that state laws on consent to recording may vary. <span className="CaseLaw_Emphasis">(See Glik v. Cunniffe, 2011; Fordyce v. City of Seattle, 1995)</span>
                        </p>
                        <p>
                          The first button announces a message saying that this conversation is being recorded for your records.
                        </p>
                        <p>
                          The second button informs the officer that your rights under the US Constitution inform you that you do not have to answer anything if you have not done something wrong.
                        </p>
                        <p>
                          The third button asks if they can provide their identification – a badge number. This is important for your records as it lets you know who they are.
                        </p>
                        <p>
                          The fourth button asks if you are free to go.
                        </p>
                        <p>
                          These buttons have a "yes or no" at the end of each sentence to make sure the officer knows to say yes or no.
                        </p>
                        <p>
                          Before you finish, press the goodbye button. This informs the officer that you have kept this for your records and wishes them a good day.
                        </p>
                        <p>
                          Once it's completed, the interaction appears in your saved recordings of interactions. You can hear them or copy them to send to someone else to keep for the records. The interaction also records the date/time and your GPS coordinate of where you were when you recorded this. I would recommend if this happens to you, you should immediately press copy and send this to whoever you would like to have another proof of this record.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom section with close button and story link */}
            <div className="flex flex-col items-center gap-4 pt-4">
              {/* Story Link */}
              <div className="text-center">
                <p className="text-gray-400 mb-2">
                  {language === 'es' 
                    ? '¿Quieres saber más sobre cómo se creó esta aplicación?' 
                    : 'Want to learn more about how this app came to be?'}
                </p>
                <a
                  href="/background-story.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1.5"
                >
                  <span className="underline">
                    {language === 'es' ? 'Lee nuestra historia' : 'Read our story'}
                  </span>
                  <ArrowUpRight size={16} />
                </a>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-800 text-gray-100 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                {language === 'es' ? 'Cerrar' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;