import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export interface SubmissionConfirmationEmailProps {
  name: string;
  email: string;
  portfolio: string;
  pitch: string;
  submissionId: string;
}

export const SubmissionConfirmationEmail = ({
  name,
  email,
  portfolio,
  pitch,
  submissionId,
}: SubmissionConfirmationEmailProps) => {
  return (
    <Html lang="es">
      <Head />
      <Preview>¡Hemos recibido tu pitch para Garage Comics!</Preview>
      <Tailwind>
        <Body className="bg-slate-100 font-sans m-0 p-0 w-full">
          <Container className="max-w-2xl mx-auto bg-white p-0">
            {/* Header */}
            <Section className="text-center pt-8 pb-6 px-6 border-b-4 border-red-600 bg-white">
              <Img
                src="https://garagecomics.mx/_astro/logo.BU2cr8N9.png"
                alt="Garage Comics Logo"
                width={200}
                height={80}
                className="mx-auto mb-2"
              />
            </Section>

            {/* Main Content */}
            <Section className="bg-slate-50 py-8 px-6">
              <Heading className="text-slate-800 text-2xl font-bold mb-4 mt-0 leading-7">
                ¡Gracias por tu pitch!
              </Heading>
              <Text className="text-slate-600 text-base leading-6 mb-4">
                Hola {name},
              </Text>
              <Text className="text-slate-600 text-base leading-6 mb-4">
                Hemos recibido tu pitch para participar con Garage Comics.
                Nuestro equipo revisará tu trabajo y nos pondremos en contacto
                contigo pronto.
              </Text>
              <Text className="text-slate-600 text-base leading-6 mb-4">
                Te agradecemos el tiempo que has invertido en presentar tu
                pitch.
              </Text>
            </Section>

            {/* Submission Details */}
            <Section className="bg-white py-6 px-6 rounded-lg">
              <Heading className="text-slate-800 text-lg font-bold mb-4 mt-0 leading-6">
                Detalles de tu pitch
              </Heading>
              <Text className="text-slate-600 text-base leading-6 mb-3">
                <strong>ID de la solicitud:</strong> {submissionId}
              </Text>
              <Text className="text-slate-600 text-base leading-6 mb-3">
                <strong>Nombre:</strong> {name}
              </Text>
              <Text className="text-slate-600 text-base leading-6 mb-3">
                <strong>Email:</strong> {email}
              </Text>
              <Text className="text-slate-600 text-base leading-6 mb-3">
                <strong>Portafolio:</strong>{" "}
                <a
                  href={portfolio}
                  className="text-red-600"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {portfolio}
                </a>
              </Text>
            </Section>

            {/* Pitch Content */}
            <Section className="bg-slate-50 py-6 px-6 rounded-lg">
              <Heading className="text-slate-800 text-lg font-bold mb-4 mt-0 leading-6">
                Tu Pitch
              </Heading>
              <Text className="text-slate-600 text-base leading-6 mb-0 bg-white p-4 rounded border-l-4 border-red-600">
                {pitch}
              </Text>
            </Section>

            {/* Next Steps */}
            <Section className="bg-white py-6 px-6 rounded-lg">
              <Heading className="text-slate-800 text-lg font-bold mb-4 mt-0 leading-6">
                ¿Qué sigue?
              </Heading>
              <Text className="text-slate-600 text-base leading-6 mb-3">
                📋 Nuestro equipo revisará tu pitch en los próximos días
              </Text>
              <Text className="text-slate-600 text-base leading-6 mb-3">
                📧 Te contactaremos si tu pitch es seleccionada para la
                siguiente fase
              </Text>
              <Text className="text-slate-600 text-base leading-6 mb-0">
                🎨 Mientras tanto, puedes seguir creando y mejorando tu
                portafolio
              </Text>
            </Section>

            {/* Footer */}
            <Section className="text-center py-8 px-6 border-t border-slate-200 bg-white">
              <Text className="text-sm text-slate-600 leading-6 mb-4">
                Si tienes alguna pregunta sobre el proceso de selección, no
                dudes en contactarnos contestando este correo.
              </Text>
              <Text className="text-sm text-slate-600 leading-6 m-0">
                <strong>Garage Comics</strong>
                <br />
                hola@garagecomics.mx
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default SubmissionConfirmationEmail;
