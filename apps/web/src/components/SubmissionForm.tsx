import { actions } from "astro:actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const submissionSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  correo: z.email("Por favor ingresa un correo electrónico válido"),
  portafolio: z.url("Por favor ingresa una URL válida").refine((url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }, "La URL debe ser válida y usar http o https"),
  pitch: z
    .string()
    .min(1, "El pitch es requerido")
    .max(500, "El pitch no puede exceder 500 caracteres"),
});

type SubmissionFormaData = z.infer<typeof submissionSchema>;

export default function ParticipaForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<SubmissionFormaData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      nombre: "",
      correo: "",
      portafolio: "",
      pitch: "",
    },
  });

  const onSubmit = async (data: SubmissionFormaData) => {
    setIsSubmitting(true);

    try {
      const { data: result, error } = await actions.sendSubmission(data);

      if (error) {
        console.error("Error enviando participación:", error);
        // Aquí puedes mostrar un mensaje de error al usuario
        setIsSubmitting(false);
        return;
      }

      console.log("Participación enviada exitosamente:", result);
      setSubmitted(true);
      setIsSubmitting(false);

      // Reset después de 3 segundos
      setTimeout(() => {
        setSubmitted(false);
        form.reset();
      }, 3000);
    } catch (error) {
      console.error("Error inesperado:", error);
      setIsSubmitting(false);
    }
  };

  const watchedPitch = form.watch("pitch");
  const pitchLength = watchedPitch?.length || 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <p className="text-gray-600 mb-8 text-center">
        Comparte tu historia y forma parte de nuestra comunidad de creadores de
        cómics.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Nombre<span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Tu nombre" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="correo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Correo electrónico<span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="email" placeholder="tu@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="portafolio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Link a tu portafolio (Instagram, Tumblr, etc.)
                  <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://tu-portafolio.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pitch"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Pitch de tu historia (máximo un párrafo)
                  <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe en un párrafo la historia que quieres compartir con nosotros..."
                    className="resize-none"
                    rows={4}
                    maxLength={500}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  <span
                    className={
                      pitchLength > 450
                        ? "text-red-500"
                        : "text-muted-foreground"
                    }
                  >
                    {pitchLength}
                  </span>
                  /500 caracteres
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`w-full ${
                submitted ? "bg-green-600 hover:bg-green-700" : ""
              }`}
            >
              {submitted
                ? "¡Enviado!"
                : isSubmitting
                  ? "Enviando..."
                  : "Enviar"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
