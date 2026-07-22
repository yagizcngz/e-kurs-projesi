using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EdTechApi.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AboutMe",
                table: "Students",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProfilePictureUrl",
                table: "Students",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AboutMe",
                table: "Students");

            migrationBuilder.DropColumn(
                name: "ProfilePictureUrl",
                table: "Students");
        }
    }
}
