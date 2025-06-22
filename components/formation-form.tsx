"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";

const formationSchema = z.object({
  titre: z.string().min(3, { message: "Le titre doit contenir au moins 3 caractères" }),
  ecole: z.string().min(3, { message: "Le nom de l'école doit contenir au moins 3 caractères" }),
  description: z.string().min(10, { message: "La description doit contenir au moins 10 caractères" }),
  categorie: z.string().min(1, { message: "Veuillez sélectionner une catégorie" }),
  duree: z.string().min(1, { message: "Veuillez indiquer la durée" }),
  niveau: z.string().min(1, { message: "Veuillez sélectionner un niveau" }),
  prerequis: z.string(),
  objectifs: z.string().min(10, { message: "Les objectifs doivent contenir au moins 10 caractères" }),
  nomFormateur: z.string().min(2, { message: "Le nom du formateur doit contenir au moins 2 caractères" }),
  emailFormateur: z.string().email({ message: "Veuillez entrer un email valide" }),
  prix: z.string().min(1, { message: "Veuillez indiquer le prix" }),
  estCertifiant: z.boolean().default(false),
  modalites: z.string().min(1, { message: "Veuillez sélectionner une modalité" }),
  dateDebut: z.string().min(1, { message: "Veuillez indiquer la date de début" }),
  competencesAcquises: z.string().min(5, { message: "Veuillez indiquer les compétences acquises" }),
  publicCible: z.string().min(5, { message: "Veuillez indiquer le public cible" }),
});

type FormationFormValues = z.infer<typeof formationSchema>;

export default function FormationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormationFormValues>({
    resolver: zodResolver(formationSchema),
    defaultValues: {
      titre: "",
      ecole: "",
      description: "",
      categorie: "",
      duree: "",
      niveau: "",
      prerequis: "",
      objectifs: "",
      nomFormateur: "",
      emailFormateur: "",
      prix: "",
      estCertifiant: false,
      modalites: "",
      dateDebut: "",
      competencesAcquises: "",
      publicCible: "",
    },
  });

  async function onSubmit(data: FormationFormValues) {
    setIsSubmitting(true);
    try {
      
      toast({
        title: "Formation enregistrée",
        description: "Votre formation a été enregistrée avec succès dans la base de données.",
      });
      form.reset();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement de la formation.",
        variant: "destructive",
      });
      console.error("Erreur lors de l'enregistrement:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Ajouter une nouvelle formation</CardTitle>
        <CardDescription>
          Remplissez ce formulaire pour ajouter une nouvelle formation à la base de données.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="titre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre de la formation</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Développement Web avec React" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ecole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de l'école</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: OpenClassrooms" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categorie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une catégorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="informatique">Informatique</SelectItem>
                        <SelectItem value="management">Management</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="langues">Langues</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="sante">Santé</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="niveau"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Niveau</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un niveau" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="debutant">Débutant</SelectItem>
                        <SelectItem value="intermediaire">Intermédiaire</SelectItem>
                        <SelectItem value="avance">Avancé</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duree"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durée</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 35 heures" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 1500 €" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateDebut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de début</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modalites"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modalités</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une modalité" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="presentiel">Présentiel</SelectItem>
                        <SelectItem value="distanciel">Distanciel</SelectItem>
                        <SelectItem value="hybride">Hybride</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nomFormateur"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du formateur</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Jean Dupont" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailFormateur"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email du formateur</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: jean.dupont@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estCertifiant"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Formation certifiante</FormLabel>
                      <FormDescription>
                        Cette formation délivre-t-elle un certificat ou un diplôme?
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez le contenu de la formation en détail..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="objectifs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objectifs pédagogiques</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Quels sont les objectifs de cette formation?"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prerequis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prérequis</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Quels sont les prérequis pour suivre cette formation?"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="competencesAcquises"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compétences acquises</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Quelles compétences seront acquises à l'issue de cette formation?"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="publicCible"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Public cible</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="À qui s'adresse cette formation?"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement en cours...
                </>
              ) : (
                "Enregistrer la formation"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
