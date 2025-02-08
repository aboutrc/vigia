import React from 'react';
import { X } from 'lucide-react';
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
              <p className="text-gray-300 font-medium text-lg">
                {language === 'es' 
                  ? 'VÍGIA es una aplicación comunitaria diseñada para ayudar a proteger los derechos de los inmigrantes y proporcionar herramientas para interacciones seguras con las autoridades.'
                  : 'VÍGIA is a community-driven application designed to help protect immigrant rights and provide tools for safe interactions with authorities.'}
              </p>
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
                    <p>
                      Starting the app, you will be presented with a map of your area. You will see markers that will show community reported sightings of ICE or law enforcement. Click on the place a mark, then click on the map where you see them. This will bring up a box to confirm was this ICE or police. This will place a mark that other users will be able to see.
                    </p>
                    <p>
                      Other users will be able to see these marks when they log into the site. If a user clicks on the mark, they can confirm if it is still there or passed. This will allow you to be informed of what is happening in your area.
                    </p>
                  </div>
                </div>

                {/* Encounter Mode */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    {language === 'es' ? 'Modo de Encuentro' : 'Encounter Mode'}
                  </h3>
                  <div className="space-y-4 text-gray-300 font-medium">
                    <p>
                      Imagine if ICE is at your door. There are things to consider:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>If you don't know your rights, you may just open the door.</li>
                      <li>If you speak, and you have an accent, you may be profiled and followed further.</li>
                      <li>Your fifth amendment states you don't have to speak.</li>
                      <li>You don't understand English.</li>
                    </ul>
                    <p>
                      Place the app on the door and press the listen button. This will use an AI system to listen for English speech and translate to Spanish on screen so you can understand what is being said.
                    </p>
                    <p>
                      <strong className="text-yellow-400">Important:</strong> You still should not respond. Unfortunately - we are all familiar with the fact that if someone hears that you sound spanish - they can assume that you are illegal. In the united states, that is called Racial Profiling - making a decision about something based on what you look like or what you sound like.
                    </p>
                    <p>
                      Instead of talking, press one of the pre-made buttons on the screen. It will announce the following things for you.
                    </p>
                    <p>
                      Artificial Intelligence is making these messages and making them sound like a Male Caucasian voice.
                    </p>
                    <p>
                      At the bottom there is a section where you can type your own message in Spanish. When you hit send, Artificial Intelligence will translate it to English text, pass it another AI, and turn it into a Caucasian voice for those to hear.
                    </p>
                  </div>
                </div>

                {/* Rights Panel */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    {language === 'es' ? 'Panel de Derechos' : 'Rights Panel'}
                  </h3>
                  <div className="space-y-4 text-gray-300 font-medium">
                    <p>
                      Many immigrants do not know the provisions of the constitution and how it applies to them. For example, there are many immigrants that believe that the constitution only serves American citizens. This is not true. If your feet are on American soil – the constitution protects you. In the united states, there are additions to the constitution called Amendments. There are 27 Amendments to the constitution. The 4th, 5th, and 14th amendments provide many protections that you should know.
                    </p>
                    <p>
                      The two biggest protections are - You cannot be stopped and questioned if you are not doing anything wrong. The police have to have a reason to stop you - they call this Probable Cause. You do not have to tell anyone anything if you are not doing anything wrong. Looking like an immigrant is not Probable cause to be stopped. That is Racial Profiling.
                    </p>
                    <p>
                      If you have nothing wrong, there should be no reason to answer any of their questions (5th Amendment). In criminal investigations, a Judge will sign something called a Warrant, explicitly authorizing officers to arrest you or take you into custody. If they do not have a warrant, and if you have done nothing wrong, the police legally do not have a reason to detain you.
                    </p>
                    <p>
                      You can ask the police officer "Am I free to go". Saying this statement is within your right, and informs law enforcement that you are aware of your rights, and you are clearly asking them to leave. If they keep you anyway - that is a violation of your rights, and can be brought to court.
                    </p>
                  </div>
                </div>

                {/* Proof/Registro */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    {language === 'es' ? 'Prueba/Registro' : 'Proof/Registro'}
                  </h3>
                  <div className="space-y-4 text-gray-300 font-medium">
                    <p>
                      In the Proof/Registro panel you can press the record button. This will turn on your microphone and start recording your conversation.
                    </p>
                    <p>
                      Do not say anything and press the first button. It is OK if the officer sees this. You are doing this in public, and it is within your rights to film or record interactions with law enforcement.
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
                      Once its completed, the interaction appears in your saved recordings of interactions. You can hear them, or copy it to send to someone else to keep for the records. The interaction also records the date/time, and your GPS coordinate of where you were when you recorded this. I would recommend if this happen to you, you should immediately press copy, and send this to whoever you would like to have another proof of this record.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom close button */}
            <div className="flex justify-center pt-4">
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