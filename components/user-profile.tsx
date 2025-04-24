"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export default function UserProfile() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil de Usuario</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Este es el perfil del usuario.</p>
      </CardContent>
    </Card>
  );
}
